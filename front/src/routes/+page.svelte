<script>
  import { onMount } from 'svelte';
  
  const LIEUX = {
    'esp32-01': 'Labo', 'esp32-02': 'Amphi',
    'esp32-03': 'Salle A', 'esp32-04': 'Salle B',
    'esp32-05': 'Extérieur', 'esp32-06': 'Couloir',
    'esp32-07': 'Bureau'
  };

  let ws, stations = {}, status = 'Connecté', filter = '';

  onMount(() => {
    ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => status = 'Connecté';
    
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.topic?.includes('/telemetry') && msg.payload) {
        const data = JSON.parse(msg.payload);
        stations[data.deviceId] = {
          data, lastUpdate: Date.now(), isOnline: true
        };
      }
    };
    
    ws.onclose = () => status = 'Déconnecté';

    const interval = setInterval(() => {
      Object.values(stations).forEach(s => {
        s.isOnline = (Date.now() - s.lastUpdate) < 300000;
      });
    }, 30000);

    return () => clearInterval(interval);
  });

  $: filteredStations = Object.entries(stations)
    .filter(([id]) => !filter || LIEUX[id]?.toLowerCase().includes(filter.toLowerCase()))
    .sort(([,a], [,b]) => b.isOnline - a.isOnline);

  $: avgTemp = Object.values(stations)
    .filter(s => s.isOnline)
    .reduce((sum, s) => sum + (s.data?.tempC || 0), 0) / Math.max(1, Object.keys(stations).length);
</script>

<svelte:head>
  <title>Météo Classroom</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="app">
  <header>
    <h1>Météo Classroom</h1>
    <div class="stats">
      <div class="stat">
        <span class="value">{avgTemp.toFixed(1)}°C</span>
        <span>Température moyenne</span>
      </div>
      <div class="stat">
        <span class="status">{status}</span>
      </div>
      <div class="stat">
        <span class="value">{Object.keys(stations).length}/7</span>
        <span>Stations actives</span>
      </div>
    </div>
  </header>

  <input class="search" bind:value={filter} placeholder="Rechercher..." />

  {#if filteredStations.length === 0 && Object.keys(stations).length}
    <div class="empty">Aucune station trouvée</div>
  {:else if !Object.keys(stations).length}
    <div class="empty">En attente...</div>
  {:else}
    <div class="grid">
      {#each filteredStations as [id, station]}
        <div class="card">
          <div class="header">
            <h3>{LIEUX[id] || id}</h3>
            <span class="status {station.isOnline ? 'on' : 'off'}">
              {station.isOnline ? 'ON' : 'OFF'}
            </span>
          </div>

          <div class="metrics">
            <div class="metric">
              <div class="value">{station.data?.tempC?.toFixed(1) ?? '--'}°C</div>
              <div class="label">Température</div>
            </div>
            <div class="metric">
              <div class="value">{station.data?.humPct?.toFixed(1) ?? '--'}%</div>
              <div class="label">Humidité</div>
            </div>
          </div>

          <div class="battery">
            <div class="value">{(station.data?.batteryPct ?? 0)}%</div>
            <div class="label">Batterie</div>
          </div>

          <div class="time">
            <div class="label">Mis à jour</div>
            <div class="value">{new Date(station.lastUpdate).toLocaleTimeString()}</div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Inter', sans-serif;
    background: #f5f7fa;
    color: #2d3748;
  }

  .app {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2d3748;
    text-align: center;
    margin-bottom: 2rem;
  }

  .stats {
    display: flex;
    gap: 3rem;
    justify-content: center;
    background: white;
    padding: 1.5rem 3rem;
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 3rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .value {
    font-size: 1.4rem;
    font-weight: 600;
    color: #2d3748;
  }

  .stats .status {
    padding: 0.5rem 1.5rem;
    border-radius: 20px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    font-size: 0.9rem;
  }

  .stats .status.on { background: #48bb78; }
  .stats .status.off { background: #f56565; }

  .search {
    max-width: 450px;
    margin: 0 auto 3rem;
    display: block;
  }

  .search input {
    width: 100%;
    padding: 1rem 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 1rem;
    background: white;
  }

  .search input:focus {
    border-color: #4299e1;
    outline: none;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.75rem;
  }

  .card {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    border: 1px solid #edf2f7;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #edf2f7;
  }

  h3 {
    font-size: 1.3rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0;
  }

  .status {
    padding: 0.4rem 1rem;
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
  }

  .status.on { background: #48bb78; }
  .status.off { background: #f56565; }

  .metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 1.75rem;
  }

  .metric {
    text-align: center;
  }

  .metric .value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .metric:nth-child(2) .value {
    color: #805ad5;
  }

  .metric .label {
    font-size: 0.85rem;
    color: #718096;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .battery {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: #ebf8ff;
    border-radius: 12px;
    margin-bottom: 1.25rem;
    border: 1px solid #bee3f8;
  }

  .battery .value {
    font-size: 1.4rem;
    font-weight: 700;
    color: #3182ce;
  }

  .time {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 12px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
  }

  .time .label {
    font-size: 0.8rem;
    color: #a0aec0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .time .value {
    font-size: 1rem;
    font-weight: 500;
    color: #4a5568;
  }

  .empty {
    text-align: center;
    padding: 4rem;
    color: #718096;
    font-size: 1.2rem;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .app { padding: 1.5rem; }
    h1 { font-size: 2rem; }
    .stats { flex-direction: column; gap: 1.5rem; }
    .grid { grid-template-columns: 1fr; }
    .metrics { grid-template-columns: 1fr; gap: 1.5rem; }
  }
</style>
