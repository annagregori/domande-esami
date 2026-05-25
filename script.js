let elencoDomande = [];

// 1. Carica i dati dal file JSON
async function caricaDati() {
    try {
        const response = await fetch('dati.json');
        elencoDomande = await response.json();
        renderTabella(elencoDomande);
    } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
    }
}

// 2. Mostra i dati nella tabella applicando gli stili Notion
function renderTabella(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    if(data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500">Nessun risultato trovato</td></tr>`;
        return;
    }

    data.forEach(item => {
        // Colore dinamico per i professori (Verde per Imbert, Rosso per Non Specificato)
        const profClass = item.prof === 'Imbert' 
            ? 'bg-[#1C3D27] text-[#52BA6F]' 
            : 'bg-[#4A2424] text-[#ECA2A2]';

        // Colore dinamico per il corso
        const corsoClass = item.corso === 'CLEA C' 
            ? 'bg-[#1F3B4D] text-[#5CA3E6]' 
            : 'bg-[#3F2D54] text-[#B388EB]';

        const row = `
            <tr class="hover:bg-[#202020] transition-colors">
                <td class="p-3 flex items-center gap-2 text-gray-200">
                    📄 ${item.domanda}
                </td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-xs font-medium ${profClass}">
                        ${item.prof}
                    </span>
                </td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-xs font-medium ${corsoClass}">
                        ${item.corso}
                    </span>
                </td>
                <td class="p-3 text-gray-400">${item.data}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// 3. Funzione di filtraggio
function applicaFiltri() {
    const profScelto = document.getElementById('filter-prof').value;
    const corsoScelto = document.getElementById('filter-corso').value;

    const datiFiltrati = elencoDomande.filter(item => {
        const matchProf = profScelto === 'all' || item.prof === profScelto;
        const matchCorso = corsoScelto === 'all' || item.corso === corsoScelto;
        return matchProf && matchCorso;
    });

    renderTabella(datiFiltrati);
}

// Ascolta i cambiamenti sui menu a tendina
document.getElementById('filter-prof').addEventListener('change', applicaFiltri);
document.getElementById('filter-corso').addEventListener('change', applicaFiltri);

// Inizializza la pagina
caricaDati();
