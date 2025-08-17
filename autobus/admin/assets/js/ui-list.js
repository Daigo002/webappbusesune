let getAll = ()=>[];

export function setDataSource(ds){ getAll = ds.getAll; }

function timeAgo(ts){
  if (!ts) return '—';
  const minutes = Math.floor((Date.now()-ts)/60000);
  if (minutes < 1) return 'ahora';
  if (minutes === 1) return 'hace 1 min';
  if (minutes < 60) return `hace ${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'hace 1 hora';
  if (hours < 24) return `hace ${hours} horas`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hace 1 día';
  return `hace ${days} días`;
}

function getStatusIcon(status) {
  switch(status) {
    case 'EN_RUTA': return '🟢';
    case 'DETENIDO': return '🟡';
    case 'SOS': return '🔴';
    case 'SIN_SENAL': return '📵';
    case 'FUERA_DE_SERVICIO': return '⚫';
    default: return '⭕';
  }
}

function getStatusColor(status) {
  switch(status) {
    case 'EN_RUTA': return 'success';
    case 'DETENIDO': return 'warning';
    case 'SOS': return 'danger';
    case 'SIN_SENAL': return 'muted';
    case 'FUERA_DE_SERVICIO': return 'muted';
    default: return 'primary';
  }
}

function getBatteryIcon(battery) {
  if (!battery || battery === '—') return '🔋';
  if (battery >= 80) return '🔋';
  if (battery >= 50) return '🔋';
  if (battery >= 20) return '🪫';
  return '🪫';
}

function getSpeedIcon(speed) {
  if (!speed || speed === 0) return '⏸️';
  if (speed > 50) return '🚀';
  if (speed > 20) return '🚗';
  return '🐌';
}

function getConnectivityStatus(lastUpdate) {
  if (!lastUpdate) return 'offline';
  const minutes = Math.floor((Date.now() - lastUpdate) / 60000);
  if (minutes <= 2) return 'online';
  if (minutes <= 10) return 'warning';
  return 'offline';
}

export function renderList(){
  const el = document.getElementById('busList');
  const rf = document.getElementById('routeFilter').value;
  const sf = document.getElementById('statusFilter').value;
  
  const items = getAll().filter(b=>{
    return (!rf || b.routeId === rf) && (!sf || b.status === sf);
  }).sort((a,b) => (b.lastUpdate||0) - (a.lastUpdate||0));

  // Refrescar dropdown de rutas con iconos
  const routes = [...new Set(getAll().map(b => b.routeId).filter(Boolean))].sort();
  const routeSel = document.getElementById('routeFilter');
  const currentRoute = routeSel.value;
  routeSel.innerHTML = '<option value="">🗺️ Todas las rutas</option>' + 
    routes.map(r => `<option value="${r}">🚌 Ruta ${r}</option>`).join('');
  if (currentRoute) routeSel.value = currentRoute;

  if (items.length === 0) {
    el.innerHTML = `
      <div style="
        text-align: center;
        padding: 40px 20px;
        color: var(--text-muted);
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">🚌</div>
        <h3 style="margin: 0 0 8px 0; font-weight: 600;">Sin buses disponibles</h3>
        <p style="margin: 0; font-size: 14px;">
          ${rf || sf ? 'No se encontraron buses con los filtros aplicados' : 'Esperando datos en tiempo real...'}
        </p>
      </div>
    `;
    return;
  }

  el.innerHTML = items.map(b => {
    const connectivity = getConnectivityStatus(b.lastUpdate);
    const statusIcon = getStatusIcon(b.status);
    const batteryIcon = getBatteryIcon(b.battery);
    const speedIcon = getSpeedIcon(b.speed);
    
    return `
      <div class="bus-card" data-id="${b.driverId}" onclick="focusBus('${b.driverId}')">
        <h4>
          ${b.alias || `Bus ${b.driverId}`}
          <div style="margin-left: auto; display: flex; align-items: center; gap: 4px;">
            <span class="status-indicator ${connectivity}"></span>
            <span style="font-size: 12px; color: var(--text-muted);">${connectivity === 'online' ? 'En línea' : connectivity === 'warning' ? 'Intermitente' : 'Desconectado'}</span>
          </div>
        </h4>
        
        <div class="muted">
          🗺️ Ruta: <strong>${b.routeName || b.routeId || '—'}</strong>
        </div>
        
        <div style="margin: 10px 0;">
          <span class="pill pill-${getStatusColor(b.status)}">${statusIcon} ${b.status || '—'}</span>
        </div>
        
        <div class="muted">
          ${speedIcon} Velocidad: <strong>${b.speed ?? '—'} km/h</strong>
        </div>
        
        <div class="muted">
          ${batteryIcon} Batería: <strong>${b.battery ?? '—'}%</strong>
        </div>
        
        <div class="muted" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border);">
          🕐 Último: <strong>${timeAgo(b.lastUpdate)}</strong>
        </div>
      </div>
    `;
  }).join('');
}

export function applyFilters(){ 
  renderList();
  
  // Añadir pequeña animación a los filtros
  const filters = document.querySelectorAll('.filters select');
  filters.forEach(filter => {
    filter.style.transform = 'scale(0.98)';
    setTimeout(() => {
      filter.style.transform = 'scale(1)';
    }, 100);
  });
}

// Función global para enfocar un bus en el mapa
window.focusBus = function(driverId) {
  // Esta función será implementada en map.js para centrar el mapa en el bus seleccionado
  if (window.focusMapOnBus) {
    window.focusMapOnBus(driverId);
  }
  
  // Destacar visualmente la tarjeta seleccionada
  document.querySelectorAll('.bus-card').forEach(card => {
    card.style.background = '';
    card.style.borderColor = '';
  });
  
  const selectedCard = document.querySelector(`[data-id="${driverId}"]`);
  if (selectedCard) {
    selectedCard.style.background = 'var(--surface-hover)';
    selectedCard.style.borderColor = 'var(--primary)';
  }
};

// Mejorar la experiencia de carga con skeleton
export function showLoadingSkeleton() {
  const el = document.getElementById('busList');
  el.innerHTML = Array(3).fill(0).map(() => `
    <div class="bus-card" style="animation: pulse 1.5s ease-in-out infinite;">
      <div style="height: 20px; background: var(--border); border-radius: 4px; margin-bottom: 8px;"></div>
      <div style="height: 14px; background: var(--border); border-radius: 4px; margin-bottom: 6px; width: 80%;"></div>
      <div style="height: 24px; background: var(--border); border-radius: 12px; margin-bottom: 8px; width: 60%;"></div>
      <div style="height: 14px; background: var(--border); border-radius: 4px; width: 70%;"></div>
    </div>
  `).join('') + `
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
  `;
}