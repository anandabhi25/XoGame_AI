import json
import logging
import os
import subprocess
import time
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form, BackgroundTasks, Header, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from .db import connect, now, uid, audit, MEDIA_PATH, ROOT
from .schemas import Profile, Organisation, Job, Apply, Decision, Transition, Note, Suspension
from .seed import seed, CANDIDATE

log = logging.getLogger('xogame')
MAX_MB = int(os.getenv('MAX_VIDEO_MB','100'))
MAX_SECONDS = int(os.getenv('MAX_VIDEO_SECONDS','120'))
DOMAINS = ['engineering','design','product','marketing','operations','finance']

@asynccontextmanager
async def lifespan(app):
    seed()
    # A process restart must never leave media appearing to process forever.
    with connect() as c:
        c.execute("UPDATE videos SET status='FAILED', error='Processing interrupted. Upload the video again.' WHERE status='PROCESSING'")
    yield

app = FastAPI(title='XOGAME.AI — Open Access MVP',version='1.0.0',lifespan=lifespan,description='Shared synthetic workspace. No authentication. Do not submit private information.')
app.add_middleware(CORSMiddleware,allow_origins=os.getenv('CORS_ORIGINS','http://localhost:5173,http://127.0.0.1:5173').split(','),allow_methods=['GET','POST','PUT','PATCH','DELETE'],allow_headers=['Content-Type','Idempotency-Key'])

@app.middleware('http')
async def requests(request: Request, call_next):
    request_id=str(uuid4()); start=time.monotonic()
    response=await call_next(request)
    response.headers['X-Request-ID']=request_id
    response.headers['X-Content-Type-Options']='nosniff'
    if '/media' in request.url.path or '/documents/' in request.url.path:
        response.headers['Cache-Control']='no-store'
    log.info('request id=%s method=%s status=%s duration_ms=%.1f',request_id,request.method,response.status_code,(time.monotonic()-start)*1000)
    return response

@app.exception_handler(HTTPException)
async def http_error(request, exc):
    return JSONResponse(status_code=exc.status_code,content={'error':{'code':f'HTTP_{exc.status_code}','message':str(exc.detail)}})

@app.exception_handler(RequestValidationError)
async def validation_error(request, exc):
    details=[{'field':'.'.join(map(str,e['loc'][1:])),'message':e['msg']} for e in exc.errors()]
    return JSONResponse(status_code=422,content={'error':{'code':'VALIDATION_ERROR','message':'Please check the submitted fields.','details':details}})

def ok(data, **kwargs):
    return {'data':data, **kwargs}

def row(c, table, ident):
    # Table names only come from application constants.
    result=c.execute(f'SELECT * FROM {table} WHERE id=?',(ident,)).fetchone()
    if not result: raise HTTPException(404,'Record not found')
    return result

def org_data(r):
    return {'id':r['id'],**json.loads(r['data']),'verificationStatus':r['status'],'reason':r['reason']}

def job_data(c,r):
    return {'id':r['id'],**json.loads(r['data']),'status':r['status'],'publishedAt':r['published_at'],'organisation':org_data(row(c,'organisations',r['organisation_id']))}

def available(c,r):
    return r['status']=='PUBLISHED' and json.loads(r['data'])['deadline']>=date.today().isoformat() and row(c,'organisations',r['organisation_id'])['status']=='VERIFIED'

def profile_data(c):
    r=row(c,'profiles',CANDIDATE)
    return json.loads(r['data'])

def active_video(c):
    r=c.execute("SELECT * FROM videos WHERE candidate_id=? AND status!='DELETED' ORDER BY created_at DESC LIMIT 1",(CANDIDATE,)).fetchone()
    return video_data(r) if r else None

def video_data(r):
    return {k:r[k] for k in ['id','filename','status','consent','duration','error','created_at']}

def readiness(c):
    p=profile_data(c); v=active_video(c)
    fields={'fullName':'Full name','professionalHeadline':'Professional headline','location':'Location','professionalSummary':'Professional summary','skills':'At least one skill'}
    missing=[{'code':k,'message':label,'actionUrl':'/candidate/profile'} for k,label in fields.items() if not p[k]]
    if not p['education'] and not p['experience']:
        missing.append({'code':'background','message':'An education or experience record','actionUrl':'/candidate/profile'})
    if not v or v['status']!='READY' or not v['consent']:
        missing.append({'code':'VIDEO_NOT_READY','message':'A ready video with sharing consent','actionUrl':'/candidate/video'})
    if row(c,'profiles',CANDIDATE)['suspended']:
        missing.append({'code':'SUSPENDED','message':'Workspace candidate is suspended','actionUrl':'/admin/dashboard'})
    return {'eligible':not missing,'missingRequirements':missing,'profileCompletionPercent':round((7-min(7,len(missing)))/7*100),'video':v}

@app.get('/api/v1/health')
def health():
    with connect() as c: c.execute('SELECT 1')
    return ok({'status':'ok','mode':'open-access','syntheticData':True})

@app.get('/api/v1/config')
def config():
    return ok({'domains':DOMAINS,'maxVideoMB':MAX_MB,'maxVideoSeconds':MAX_SECONDS,'videoFormats':['video/mp4','video/webm'],'applicationFee':0,'mode':'open-access'})

@app.get('/api/v1/jobs')
def jobs(keyword:str='',city:str='',domainId:str='',workArrangement:str='',employmentType:str='',experience:int|None=Query(None,ge=0,le=50),sort:str='recent',page:int=Query(1,ge=1),limit:int=Query(8,ge=1,le=50),verifiedOnly:bool=True):
    with connect() as c:
        # SQLite JSON1 keeps filtering and pagination in the database.
        conditions=["j.status='PUBLISHED'","o.status='VERIFIED'","json_extract(j.data,'$.deadline')>=?"]
        args=[date.today().isoformat()]
        for field,value in [('domainId',domainId),('workArrangement',workArrangement),('employmentType',employmentType)]:
            if value: conditions.append(f"json_extract(j.data,'$.{field}')=?"); args.append(value)
        if keyword:
            conditions.append("(lower(j.data) LIKE ? OR lower(json_extract(o.data,'$.displayName')) LIKE ?)")
            args.extend(['%'+keyword.lower()+'%']*2)
        if city:
            conditions.append("(lower(json_extract(j.data,'$.city')) LIKE ? OR (?='remote' AND json_extract(j.data,'$.workArrangement')='REMOTE'))")
            args.extend(['%'+city.lower()+'%',city.lower()])
        if experience is not None:
            conditions.append("json_extract(j.data,'$.experienceMinYears')<=? AND json_extract(j.data,'$.experienceMaxYears')>=?"); args.extend([experience,experience])
        base=' FROM jobs j JOIN organisations o ON j.organisation_id=o.id WHERE '+' AND '.join(conditions)
        total=c.execute('SELECT count(*)'+base,args).fetchone()[0]
        order='j.published_at DESC,j.id'
        if sort=='relevance' and keyword:
            order="CASE WHEN lower(json_extract(j.data,'$.title')) LIKE ? THEN 0 ELSE 1 END,"+order
            args.append('%'+keyword.lower()+'%')
        records=c.execute('SELECT j.*'+base+' ORDER BY '+order+' LIMIT ? OFFSET ?',args+[limit,(page-1)*limit]).fetchall()
        return ok([job_data(c,r) for r in records],meta={'page':page,'limit':limit,'total':total,'totalPages':(total+limit-1)//limit})

@app.get('/api/v1/jobs/{job_id}')
def job_detail(job_id:str):
    with connect() as c:
        r=row(c,'jobs',job_id)
        if not available(c,r): raise HTTPException(404,'This opportunity is no longer available')
        return ok(job_data(c,r))

@app.get('/api/v1/candidate/profile')
def profile():
    with connect() as c: return ok({**profile_data(c),**readiness(c),'id':CANDIDATE})

@app.put('/api/v1/candidate/profile')
def save_profile(body:Profile):
    with connect() as c:
        if row(c,'profiles',CANDIDATE)['suspended']: raise HTTPException(403,'Candidate is suspended')
        c.execute('UPDATE profiles SET data=? WHERE id=?',(body.model_dump_json(),CANDIDATE))
        audit(c,'PROFILE_UPDATED',CANDIDATE)
        return ok({**body.model_dump(),**readiness(c),'id':CANDIDATE})

@app.get('/api/v1/candidate/readiness')
def get_readiness():
    with connect() as c: return ok(readiness(c))

@app.get('/api/v1/jobs/{job_id}/eligibility')
def eligibility(job_id:str):
    with connect() as c:
        j=row(c,'jobs',job_id); ready=readiness(c)
        duplicate=c.execute('SELECT id FROM applications WHERE job_id=? AND candidate_id=?',(job_id,CANDIDATE)).fetchone()
        return ok({**ready,'eligible':ready['eligible'] and available(c,j) and not duplicate,'alreadyApplied':bool(duplicate),'jobEligible':available(c,j),'applicationFee':{'amount':0,'currency':'INR'}})

async def store_upload(file:UploadFile, suffix:str, limit:int):
    ident=uid(); target=MEDIA_PATH/(ident+suffix); size=0
    try:
        with target.open('wb') as f:
            while chunk:=await file.read(1024*1024):
                size+=len(chunk)
                if size>limit: raise HTTPException(413,'File exceeds the configured size limit')
                f.write(chunk)
        if size==0: raise HTTPException(422,'The file is empty')
    except BaseException:
        target.unlink(missing_ok=True)
        raise
    finally:
        await file.close()
    return ident,target

def process_video(ident:str,source:Path):
    output=MEDIA_PATH/(ident+'.playback.mp4')
    try:
        result=subprocess.run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(source)],capture_output=True,text=True,timeout=30,check=True)
        media=json.loads(result.stdout)
        duration=float(media['format']['duration'])
        if not any(s['codec_type']=='video' for s in media['streams']): raise ValueError('No video stream found')
        if duration<=0 or duration>MAX_SECONDS: raise ValueError(f'Video must be between 0 and {MAX_SECONDS} seconds')
        subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-threads','2','-i',str(source),'-map','0:v:0','-map','0:a?','-vf',"scale='min(1280,iw)':-2",'-c:v','libx264','-preset','fast','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',str(output)],capture_output=True,timeout=180,check=True)
        with connect() as c:
            c.execute("UPDATE videos SET status='READY',path=?,duration=? WHERE id=? AND status='PROCESSING'",(str(output),duration,ident))
            audit(c,'VIDEO_READY',ident)
    except Exception as e:
        output.unlink(missing_ok=True)
        message=str(e) if isinstance(e,ValueError) else 'Video processing failed. Try a valid MP4 or WebM.'
        with connect() as c:
            c.execute("UPDATE videos SET status='FAILED',error=? WHERE id=? AND status='PROCESSING'",(message,ident))
            audit(c,'VIDEO_FAILED',ident)
    finally:
        source.unlink(missing_ok=True)

@app.post('/api/v1/candidate/videos',status_code=202)
async def upload_video(background:BackgroundTasks,file:UploadFile=File(...),consent:bool=Form(...)):
    if not consent: raise HTTPException(422,'Processing and sharing consent is required')
    ext=Path(file.filename or '').suffix.lower()
    if (ext,file.content_type) not in [('.mp4','video/mp4'),('.webm','video/webm')]: raise HTTPException(415,'Only MP4 and WebM video resumes are accepted. PDF and text resumes are not supported.')
    with connect() as c:
        if row(c,'profiles',CANDIDATE)['suspended']: raise HTTPException(403,'Candidate is suspended')
    ident,path=await store_upload(file,ext,MAX_MB*1024*1024)
    signature=path.read_bytes()[:32]
    if not ((ext=='.mp4' and b'ftyp' in signature) or (ext=='.webm' and signature.startswith(b'\x1aE\xdf\xa3'))):
        path.unlink(missing_ok=True); raise HTTPException(415,'File contents do not match the selected video format')
    with connect() as c:
        c.execute('INSERT INTO videos VALUES(?,?,?,?,?,?,?,?,?)',(ident,CANDIDATE,Path(file.filename).name,str(path),'PROCESSING',1,None,None,now()))
        audit(c,'VIDEO_PROCESSING',ident,{'consent':True})
    background.add_task(process_video,ident,path)
    return ok({'id':ident,'status':'PROCESSING'})

@app.get('/api/v1/candidate/videos/current')
def current_video():
    with connect() as c: return ok(active_video(c))

@app.get('/api/v1/videos/{video_id}/media')
def media(video_id:str):
    with connect() as c:
        v=row(c,'videos',video_id)
        if v['status']!='READY' or not v['consent']: raise HTTPException(404,'Video is not available')
        path=Path(v['path'])
        if not path.is_file(): raise HTTPException(404,'Video file is unavailable')
        return FileResponse(path,media_type='video/mp4',filename='video-resume.mp4',content_disposition_type='inline',headers={'Cache-Control':'no-store'})

@app.delete('/api/v1/candidate/videos/{video_id}')
def delete_video(video_id:str):
    with connect() as c:
        v=row(c,'videos',video_id)
        c.execute("UPDATE videos SET status='DELETED',consent=0 WHERE id=?",(video_id,))
        Path(v['path']).unlink(missing_ok=True)
        audit(c,'VIDEO_DELETED',video_id)
    return ok({'deleted':True})

@app.post('/api/v1/jobs/{job_id}/applications',status_code=201)
def apply(job_id:str,body:Apply,idempotency_key:str|None=Header(None)):
    with connect() as c:
        c.execute('BEGIN IMMEDIATE')
        if idempotency_key:
            existing=c.execute('SELECT * FROM applications WHERE idempotency_key=?',(idempotency_key,)).fetchone()
            if existing:
                if existing['job_id']!=job_id or existing['video_id']!=body.videoResumeId or not body.confirmProfileSharing: raise HTTPException(409,'Idempotency key was already used for another request')
                return ok({'applicationId':existing['id'],'status':existing['status'],'applicationFee':0})
        j=row(c,'jobs',job_id)
        if not available(c,j): raise HTTPException(409,'This job is not accepting applications')
        if c.execute('SELECT 1 FROM applications WHERE candidate_id=? AND job_id=?',(CANDIDATE,job_id)).fetchone(): raise HTTPException(409,'You have already applied to this job')
        if not body.confirmProfileSharing: raise HTTPException(422,'Explicit profile and video sharing consent is required')
        ready=readiness(c)
        if not ready['eligible']: raise HTTPException(422,'Complete your profile and upload a ready video before applying')
        if ready['video']['id']!=body.videoResumeId: raise HTTPException(409,'The selected video is no longer current. Review your application again.')
        ident=uid(); stamp=now()
        c.execute('INSERT INTO applications VALUES(?,?,?,?,?,?,?,?,?)',(ident,CANDIDATE,job_id,j['organisation_id'],body.videoResumeId,json.dumps(profile_data(c)),'SUBMITTED',stamp,idempotency_key))
        c.execute('INSERT INTO events VALUES(?,?,?,?)',(uid(),ident,'SUBMITTED',stamp))
        c.execute('INSERT INTO notifications VALUES(?,?,?,?,0)',(uid(),ident,'Application submitted to '+json.loads(j['data'])['title'],stamp))
        audit(c,'APPLICATION_SUBMITTED',ident,{'sharingConsent':True,'fee':0})
        return ok({'applicationId':ident,'jobId':job_id,'status':'SUBMITTED','applicationFee':0,'submittedAt':stamp})

def application_data(c,r,employer=False):
    result={'id':r['id'],'job':job_data(c,row(c,'jobs',r['job_id'])),'status':r['status'],'submittedAt':r['submitted_at'],'videoId':r['video_id'],'events':[dict(x) for x in c.execute('SELECT * FROM events WHERE application_id=? ORDER BY created_at',(r['id'],))]}
    if employer:
        result['profile']=json.loads(r['profile_snapshot'])
        result['notes']=[dict(x) for x in c.execute('SELECT * FROM notes WHERE application_id=? ORDER BY created_at',(r['id'],))]
    return result

@app.get('/api/v1/candidate/applications')
def applications():
    with connect() as c: return ok([application_data(c,r) for r in c.execute('SELECT * FROM applications WHERE candidate_id=? ORDER BY submitted_at DESC',(CANDIDATE,))])

@app.get('/api/v1/candidate/notifications')
def notifications():
    with connect() as c: return ok([dict(r) for r in c.execute('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100')])

@app.patch('/api/v1/candidate/notifications/{notification_id}/read')
def read_notification(notification_id:str):
    with connect() as c:
        row(c,'notifications',notification_id)
        c.execute('UPDATE notifications SET read=1 WHERE id=?',(notification_id,))
    return ok({'read':True})

@app.get('/api/v1/organisations')
def organisations(verifiedOnly:bool=False):
    with connect() as c:
        rows=c.execute('SELECT * FROM organisations'+(" WHERE status='VERIFIED'" if verifiedOnly else '')).fetchall()
        return ok([org_data(r) for r in rows])

@app.post('/api/v1/organisations',status_code=201)
def create_org(body:Organisation):
    with connect() as c:
        ident=uid()
        c.execute('INSERT INTO organisations VALUES(?,?,?,?)',(ident,body.model_dump_json(),'NOT_SUBMITTED',''))
        audit(c,'ORGANISATION_CREATED',ident)
        return ok(org_data(row(c,'organisations',ident)))

@app.post('/api/v1/organisations/{org_id}/documents',status_code=201)
async def upload_document(org_id:str,file:UploadFile=File(...)):
    with connect() as c: row(c,'organisations',org_id)
    ext=Path(file.filename or '').suffix.lower()
    if (ext,file.content_type) not in [('.pdf','application/pdf'),('.png','image/png'),('.jpg','image/jpeg'),('.jpeg','image/jpeg')]: raise HTTPException(415,'Evidence must be PDF, PNG or JPEG')
    ident,path=await store_upload(file,ext,10*1024*1024)
    sig=path.read_bytes()[:8]
    if not (sig.startswith(b'%PDF-') or sig.startswith(b'\x89PNG\r\n\x1a\n') or sig.startswith(b'\xff\xd8\xff')):
        path.unlink(missing_ok=True); raise HTTPException(415,'Invalid evidence file contents')
    with connect() as c:
        c.execute('INSERT INTO documents VALUES(?,?,?,?,?)',(ident,org_id,Path(file.filename).name,str(path),now()))
        audit(c,'EVIDENCE_UPLOADED',org_id)
    return ok({'id':ident,'filename':Path(file.filename).name})

@app.get('/api/v1/admin/documents/{document_id}')
def document(document_id:str):
    with connect() as c:
        r=row(c,'documents',document_id)
        return FileResponse(r['path'],filename=r['filename'],media_type='application/octet-stream')

@app.post('/api/v1/organisations/{org_id}/verification')
def submit_verification(org_id:str):
    with connect() as c:
        r=row(c,'organisations',org_id)
        if r['status'] not in ['NOT_SUBMITTED','REJECTED']: raise HTTPException(409,'This organisation cannot submit in its current state')
        if not c.execute('SELECT 1 FROM documents WHERE organisation_id=?',(org_id,)).fetchone(): raise HTTPException(422,'Upload verification evidence before submitting')
        c.execute("UPDATE organisations SET status='SUBMITTED',reason='' WHERE id=?",(org_id,))
        audit(c,'VERIFICATION_SUBMITTED',org_id)
    return ok({'status':'SUBMITTED'})

@app.get('/api/v1/admin/verifications')
def verifications():
    with connect() as c:
        return ok([{**org_data(r),'documents':[dict(d) for d in c.execute('SELECT id,filename,created_at FROM documents WHERE organisation_id=?',(r['id'],))]} for r in c.execute('SELECT * FROM organisations')])

@app.patch('/api/v1/admin/verifications/{org_id}')
def verify(org_id:str,body:Decision):
    with connect() as c:
        c.execute('BEGIN IMMEDIATE'); r=row(c,'organisations',org_id)
        allowed={'SUBMITTED':['UNDER_REVIEW','VERIFIED','REJECTED'],'UNDER_REVIEW':['VERIFIED','REJECTED'],'VERIFIED':['SUSPENDED'],'SUSPENDED':['VERIFIED','REJECTED']}
        if body.status not in allowed.get(r['status'],[]): raise HTTPException(409,'Invalid verification transition')
        if body.status in ['REJECTED','SUSPENDED'] and not body.reason.strip(): raise HTTPException(422,'A decision reason is required')
        c.execute('UPDATE organisations SET status=?,reason=? WHERE id=?',(body.status,body.reason,org_id))
        audit(c,'VERIFICATION_'+body.status,org_id,{'reason':body.reason})
        return ok(org_data(row(c,'organisations',org_id)))

@app.get('/api/v1/employer/{org_id}/jobs')
def employer_jobs(org_id:str):
    with connect() as c:
        row(c,'organisations',org_id)
        return ok([{**job_data(c,r),'applicantCount':c.execute('SELECT count(*) FROM applications WHERE job_id=?',(r['id'],)).fetchone()[0]} for r in c.execute('SELECT * FROM jobs WHERE organisation_id=? ORDER BY created_at DESC',(org_id,))])

@app.post('/api/v1/employer/{org_id}/jobs',status_code=201)
def create_job(org_id:str,body:Job):
    with connect() as c:
        row(c,'organisations',org_id); ident=uid()
        c.execute('INSERT INTO jobs VALUES(?,?,?,?,?,?)',(ident,org_id,body.model_dump_json(),'DRAFT',None,now()))
        audit(c,'JOB_CREATED',ident)
        return ok(job_data(c,row(c,'jobs',ident)))

def scoped_job(c,org_id,job_id):
    j=row(c,'jobs',job_id)
    if j['organisation_id']!=org_id: raise HTTPException(404,'Job not found in this organisation')
    return j

@app.put('/api/v1/employer/{org_id}/jobs/{job_id}')
def update_job(org_id:str,job_id:str,body:Job):
    with connect() as c:
        scoped_job(c,org_id,job_id)
        c.execute('UPDATE jobs SET data=? WHERE id=?',(body.model_dump_json(),job_id))
        audit(c,'JOB_UPDATED',job_id)
        return ok(job_data(c,row(c,'jobs',job_id)))

@app.post('/api/v1/employer/{org_id}/jobs/{job_id}/{action}')
def publish_job(org_id:str,job_id:str,action:str):
    with connect() as c:
        c.execute('BEGIN IMMEDIATE'); j=scoped_job(c,org_id,job_id)
        if action=='publish':
            if row(c,'organisations',org_id)['status']!='VERIFIED': raise HTTPException(403,'Only verified organisations can publish jobs')
            if json.loads(j['data'])['deadline']<date.today().isoformat(): raise HTTPException(422,'Choose a future application deadline')
            status='PUBLISHED'
        elif action=='close': status='CLOSED'
        else: raise HTTPException(404,'Unknown job action')
        c.execute('UPDATE jobs SET status=?,published_at=COALESCE(published_at,?) WHERE id=?',(status,now(),job_id))
        audit(c,'JOB_'+status,job_id)
        return ok(job_data(c,row(c,'jobs',job_id)))

@app.get('/api/v1/employer/{org_id}/applications')
def employer_applications(org_id:str,jobId:str='',status:str='',keyword:str=''):
    with connect() as c:
        row(c,'organisations',org_id)
        records=c.execute('SELECT * FROM applications WHERE organisation_id=? ORDER BY submitted_at DESC',(org_id,)).fetchall()
        return ok([application_data(c,r,True) for r in records if (not jobId or r['job_id']==jobId) and (not status or r['status']==status) and (not keyword or keyword.lower() in r['profile_snapshot'].lower())])

def scoped_application(c,org_id,application_id):
    r=row(c,'applications',application_id)
    if r['organisation_id']!=org_id: raise HTTPException(404,'Application not found in this organisation')
    return r

@app.patch('/api/v1/employer/{org_id}/applications/{application_id}/status')
def update_status(org_id:str,application_id:str,body:Transition):
    with connect() as c:
        c.execute('BEGIN IMMEDIATE'); r=scoped_application(c,org_id,application_id)
        allowed={'SUBMITTED':['VIEWED','SHORTLISTED','REJECTED'],'VIEWED':['SHORTLISTED','REJECTED'],'SHORTLISTED':['REJECTED'],'REJECTED':[]}
        if r['status']!=body.expectedCurrentStatus or body.status not in allowed[r['status']]: raise HTTPException(409,'The application changed or this transition is not available. Refresh and retry.')
        stamp=now()
        c.execute('UPDATE applications SET status=? WHERE id=?',(body.status,application_id))
        c.execute('INSERT INTO events VALUES(?,?,?,?)',(uid(),application_id,body.status,stamp))
        c.execute('INSERT INTO notifications VALUES(?,?,?,?,0)',(uid(),application_id,'Application '+body.status.lower(),stamp))
        audit(c,'APPLICATION_'+body.status,application_id)
        return ok(application_data(c,row(c,'applications',application_id),True))

@app.post('/api/v1/employer/{org_id}/applications/{application_id}/notes',status_code=201)
def add_note(org_id:str,application_id:str,body:Note):
    with connect() as c:
        scoped_application(c,org_id,application_id); ident=uid()
        c.execute('INSERT INTO notes VALUES(?,?,?,?)',(ident,application_id,body.body,now()))
        audit(c,'RECRUITMENT_NOTE_ADDED',application_id)
    return ok({'id':ident})

@app.get('/api/v1/admin/users')
def users():
    with connect() as c:
        return ok([{'id':r['id'],'fullName':json.loads(r['data'])['fullName'],'suspended':bool(r['suspended'])} for r in c.execute('SELECT * FROM profiles')])

@app.patch('/api/v1/admin/users/{candidate_id}')
def suspend(candidate_id:str,body:Suspension):
    with connect() as c:
        row(c,'profiles',candidate_id)
        c.execute('UPDATE profiles SET suspended=? WHERE id=?',(int(body.suspended),candidate_id))
        audit(c,'CANDIDATE_SUSPENSION_UPDATED',candidate_id,{'suspended':body.suspended})
    return ok(body.model_dump())

@app.get('/api/v1/admin/audit')
def audit_log():
    with connect() as c: return ok([dict(r) for r in c.execute('SELECT * FROM audit ORDER BY created_at DESC LIMIT 200')])

# Same-origin deployment: API, standalone marketing, and built React app.
app.mount('/landing',StaticFiles(directory=ROOT.parent/'landing',html=True),name='landing')

@app.get('/{path:path}',include_in_schema=False)
def frontend(path:str):
    dist=ROOT.parent/'frontend'/'dist'
    target=(dist/path).resolve()
    if target.is_relative_to(dist.resolve()) and target.is_file(): return FileResponse(target)
    if path.startswith('api/'): raise HTTPException(404,'Endpoint not found')
    if (dist/'index.html').exists(): return FileResponse(dist/'index.html')
    return JSONResponse(status_code=503,content={'error':{'message':'Frontend not built. Run npm run build in frontend, or start the Vite dev server.'}})
