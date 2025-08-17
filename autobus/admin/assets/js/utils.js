export function msToHMS(ms){
  const s = Math.floor(ms/1000);
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const ss = s%60;
  return [h,m,ss].map(x=>String(x).padStart(2,'0')).join(':');
}

export function downloadCSV(filename, header, rows){
  const csv = [header.join(','), ...rows.map(r=>r.map(v=>{
    const s = (v??'').toString();
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
