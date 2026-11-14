import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, MapPin, Clock3, ArrowRight, X, RotateCcw, BadgeCheck } from 'lucide-react';
import { label, money } from './api';
import type { Job } from './types';

export function Brand() { return <Link className="brand" to="/jobs" aria-label="XOGAME home"><span className="brand-mark">x<span>o</span></span>XOGAME<span className="brand-ai">.AI</span></Link>; }
export function Badge({status}: {status:string}) { return <span className={`badge ${status.toLowerCase()}`}>{status==='VERIFIED' && <BadgeCheck size={12}/>} {label(status)}</span>; }
export function ErrorBox({error,retry}: {error:Error|null;retry?:()=>void}) { return error ? <div className="error-box" role="alert"><p>{error.message}</p>{retry && <button className="text-button" onClick={retry}><RotateCcw size={14}/> Try again</button>}</div> : null; }
export function Empty({title,children}: {title:string;children:ReactNode}) { return <div className="empty"><span className="empty-symbol">↗</span><h3>{title}</h3><div>{children}</div></div>; }
export function Loading() { return <div className="skeleton-wrap" role="status" aria-label="Loading"><span className="sr-only">Loading…</span>{[1,2,3,4].map(i=><div className="skeleton" key={i}><i/><i/><i/></div>)}</div>; }
export function PageHeading({eyebrow,title,description,action}: {eyebrow:string;title:string;description?:string;action?:ReactNode}) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>; }
export function JobCard({job}: {job:Job}) { return <Link className="job-card group" to={`/jobs/${job.id}`}><div className="job-card-top"><div className={`company-mark mark-${job.organisation.id.slice(-1)}`}>{job.organisation.displayName.charAt(0).toLowerCase()}<span>.</span></div><ArrowUpRight size={18} className="card-arrow"/></div><div className="company-name">{job.organisation.displayName}{job.organisation.verificationStatus==='VERIFIED' && <BadgeCheck size={13} className="blue"/>}<span className="demo-tag">DEMO</span></div><h3>{job.title}</h3><div className="job-location"><MapPin size={12}/>{job.city}<span>·</span>{label(job.workArrangement)}</div><div className="job-tags"><span>{label(job.employmentType)}</span><span>{job.experienceMinYears}–{job.experienceMaxYears} years</span></div><div className="job-card-bottom"><strong>{job.salaryMin ? `${money(job.salaryMin,job.salaryCurrency)} – ${money(job.salaryMax,job.salaryCurrency)}` : 'Salary not disclosed'}{job.salaryMin && <small> / {job.salaryPeriod==='YEAR'?'year':'month'}</small>}</strong><span className="free-label"><Check size={11}/> Free to apply</span></div></Link>; }
export function Dialog({title,children,onClose}: {title:string;children:ReactNode;onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ const el=ref.current; const focused=document.activeElement as HTMLElement|null; el?.showModal(); return ()=>{el?.close();focused?.focus();}; },[]);
  return <dialog ref={ref} className="dialog" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}} aria-labelledby="dialog-title"><div className="dialog-head"><h2 id="dialog-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19}/></button></div>{children}</dialog>;
}
export function Hint({children}: {children:ReactNode}) { return <p className="hint"><Clock3 size={13}/>{children}</p>; }
export function NextLink({to,children}: {to:string;children:ReactNode}) { return <Link className="text-button" to={to}>{children}<ArrowRight size={14}/></Link>; }
