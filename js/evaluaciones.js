const criteriaList = [
  { 
    id: 1, name: 'Presentación', weight: 5,
    guide: {
      4: 'Cumple con todos los lineamientos para entrar al Hospital virtual (zapatos, bata, gafete, no aretes, cabello recogido, traje quirúrgico).',
      3: 'No cumple con alguno de los lineamientos.',
      2: 'No cumple con dos de los lineamientos.',
      1: 'No cumple con tres o más de los lineamientos.'
    }
  },
  { 
    id: 2, name: 'Instrumentaría', weight: 5,
    guide: {
      4: 'Uso de Estetoscopio, lámpara, otoscopio, oftalmoscopio.',
      3: 'No cumple con alguno de los instrumentos.',
      2: 'No cumple con dos de los instrumentos.',
      1: 'No cumple con tres o más de los instrumentos.'
    }
  },
  { 
    id: 3, name: 'Interrogatorio Clínico', weight: 15,
    guide: {
      4: 'Realiza un interrogatorio dirigido con preguntas objetivas y en base al tema, sin ser repetitivo y congruente al tema.',
      3: 'Realiza preguntas subjetivas, repetitivo, con poca información al tema.',
      2: 'Realiza preguntas subjetivas, no explicitas, de poca o nula información para el tema.',
      1: 'No realiza preguntas y si las realizan estas no abonan al tema.'
    }
  },
  { 
    id: 4, name: 'Evaluación Física y Psíquica', weight: 15,
    guide: {
      4: 'Valora el estado físico y psíquico del paciente.',
      3: 'Solo toma un aspecto ya sea físico o psíquico.',
      2: 'Teniendo los datos no realiza la evaluación.',
      1: 'No la realiza.'
    }
  },
  { 
    id: 5, name: 'Revisión del Equipo', weight: 10,
    guide: {
      4: 'Revisa el carro rojo, el equipo laríngeo, el desfibrilador, que los parámetros del monitor sean del paciente.',
      3: 'Revisa parte del equipo.',
      2: 'Revisa el equipo cuando lo va a ocupar.',
      1: 'No revisa el equipo.'
    }
  },
  { 
    id: 6, name: 'Comprensión del Caso', weight: 15,
    guide: {
      4: 'Completo.',
      3: 'Casi íntegro.',
      2: 'Parcial.',
      1: 'Omite esencial.'
    }
  },
  { 
    id: 7, name: 'Priorización Terapéutica', weight: 15,
    guide: {
      4: 'Con los datos clínicos, laboratoriales, factores de riesgo, somatometria, gabiente; decide la actuación más conveniente para el paciente.',
      3: 'Con los datos clínicos, laboratoriales, factores de riesgo, somatometria, gabiente; se enfoca en un solo síntoma o estudio.',
      2: 'Con los datos clínicos, laboratoriales, factores de riesgo, somatometria, gabiente; decide equivocadamente para la mejoría del paciente.',
      1: 'Con los datos clínicos, laboratoriales, factores de riesgo, somatometria, gabiente; no toma alguna decisión.'
    }
  },
  { 
    id: 8, name: 'Protocolo RCP/ACLS', weight: 5,
    guide: {
      4: 'Completo.',
      3: 'Casi íntegro.',
      2: 'Parcial.',
      1: 'Omite esencial.'
    }
  },
  { 
    id: 9, name: 'Actitud y Distractores', weight: 5,
    guide: {
      4: 'Presenta una postura libre, sin objetos distractores y siendo positivo y activo hacia el paciente.',
      3: 'Se presenta libre, positivo pero estático al accionar.',
      2: 'Se presenta con distractores, no activo y con las manos en las bolsas de la bata o cruzado de brazos.',
      1: 'Hay una actitud negativa o indiferente al caso.'
    }
  },
  { 
    id: 10, name: 'Conocimiento Médico Previo', weight: 10,
    guide: {
      4: 'Domina el tema en su totalidad con cuadro clínico, laboratorios, criterios diagnósticos, uso de medicamentos y contraindicaciones, así como los diagnósticos diferenciales.',
      3: 'Hay conocimientos del tema sin tener un dominio del mismo pero sí reconoce los criterios clínicos diagnósticos.',
      2: 'Tiene conocimiento superficial del tema y no conoce los criterios clínicos diagnósticos.',
      1: 'No tienen conocimiento del tema.'
    }
  }
];

// detectar id y nombre del caso
const urlParams = new URLSearchParams(window.location.search);
let activeCaseId = (typeof currentCaseId !== 'undefined' && currentCaseId > 0)
  ? String(currentCaseId)
  : (urlParams.get('id') || '');

let activeCaseName = (typeof currentCaseName !== 'undefined' && currentCaseName)
  ? currentCaseName
  : (urlParams.get('nombre') || '');

let evaluations = JSON.parse(localStorage.getItem('cimed_evaluations')) || [];
let currentEvalId = null;
let currentStudents = [];
let currentScores = {};

let historyView, evalView, historyTbody, rubricContainer, summaryTbody, studentTagsContainer, inputStudent;

function init() {
  historyView = document.getElementById('history-view');
  evalView = document.getElementById('eval-view');
  historyTbody = document.getElementById('history-tbody');
  rubricContainer = document.getElementById('rubric-container');
  summaryTbody = document.querySelector('#summary-table tbody');
  studentTagsContainer = document.getElementById('student-tags');
  inputStudent = document.getElementById('input-student');

  if (!historyView) return;

  // asignar nombre del caso
  if (activeCaseName) {
    const historyCaseDesc = document.querySelector('.history-title-container p');
    if (historyCaseDesc) historyCaseDesc.innerText = `Caso: ${activeCaseName}`;

    const evalCaseDesc = document.querySelector('#eval-view .header p');
    if (evalCaseDesc) evalCaseDesc.innerText = `Caso: ${activeCaseName}`;
  }

  buildRubricUI();
  populateSubgroupFilter();
  renderHistory();
  loadEvaluationsFromBackend();
  
  // boton nuevo equipo
  const btnNewEval = document.getElementById('btn-new-eval');
  if (btnNewEval) {
    btnNewEval.addEventListener('click', () => {
      openEvaluation(null);
    });
  }
  
  // volver al historial
  const btnBackHistory = document.getElementById('btn-back-history');
  if (btnBackHistory) {
    btnBackHistory.addEventListener('click', () => {
      switchView('history');
    });
  }

  // guardar evaluacion
  const btnSaveEval = document.getElementById('btn-save-eval');
  if (btnSaveEval) {
    btnSaveEval.addEventListener('click', saveEvaluation);
  }

  // boton cancelar
  const btnCancelEval = document.getElementById('btn-cancel-eval');
  if (btnCancelEval) {
    btnCancelEval.addEventListener('click', () => {
      switchView('history');
    });
  }

  // volver al panel de casos
  const btnBackCases = document.getElementById('btn-back-cases');
  if (btnBackCases) {
    btnBackCases.addEventListener('click', cerrarModalEvaluaciones);
  }

  // badge de evaluacion en curso
  const statusBadge = document.querySelector('#eval-view .status-badge');
  if (statusBadge) {
    statusBadge.addEventListener('click', () => {
      switchView('history');
    });
  }

  // agregar alumno mediante funcion compartida (boton o enter)
  function addStudentAction() {
    if (!inputStudent) return;
    const name = inputStudent.value.trim();
    if (name !== '') {
      currentStudents.push(name);
      inputStudent.value = '';
      renderStudents();
      inputStudent.focus();
    }
  }

  // boton de agregar alumno para soporte touch / tablet / ipad
  const btnAddStudent = document.getElementById('btn-add-student');
  if (btnAddStudent) {
    btnAddStudent.addEventListener('click', (e) => {
      e.preventDefault();
      addStudentAction();
    });
  }

  // agregar alumno con Enter en teclado fisico o virtual
  if (inputStudent) {
    inputStudent.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addStudentAction();
      }
    });
  }

  // buscador y filtro de subgrupos
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', renderHistory);
  }

  const filterSelect = document.querySelector('.filter-select');
  if (filterSelect) {
    filterSelect.addEventListener('change', renderHistory);
  }

  // limpiar evaluaciones
  const btnClearAll = document.querySelector('.history-footer .btn-text');
  if (btnClearAll) {
    btnClearAll.addEventListener('click', clearAllEvaluations);
  }
}

window.abrirModalEvaluaciones = function(caseId, caseName) {
  activeCaseId = String(caseId);
  activeCaseName = caseName || 'Caso Clínico';

  const historyCaseDesc = document.querySelector('.history-title-container p');
  if (historyCaseDesc) historyCaseDesc.innerText = `Caso: ${activeCaseName}`;

  const evalCaseDesc = document.querySelector('#eval-view .header p');
  if (evalCaseDesc) evalCaseDesc.innerText = `Caso: ${activeCaseName}`;

  const overlay = document.querySelector('.eval-overlay');
  if (overlay) {
    overlay.classList.add('eval-active');
  }

  switchView('history');
  loadEvaluationsFromBackend();
};

window.cerrarModalEvaluaciones = function() {
  const overlay = document.querySelector('.eval-overlay');
  if (overlay) {
    overlay.classList.remove('eval-active');
  }
  if (window.location.pathname.endsWith('evaluaciones.php')) {
    window.location.href = 'admin-panel.php';
  }
};

async function loadEvaluationsFromBackend() {
  try {
    const url = activeCaseId ? `BE/get_evaluaciones.php?id_caso=${encodeURIComponent(activeCaseId)}` : 'BE/get_evaluaciones.php';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        evaluations = data;
        localStorage.setItem('cimed_evaluations', JSON.stringify(evaluations));
        populateSubgroupFilter();
        renderHistory();
      }
    }
  } catch (err) {
    // modo offline
  }
}

function switchView(view) {
  if (!evalView || !historyView) return;
  if (view === 'history') {
    evalView.classList.remove('view-active');
    historyView.classList.add('view-active');
    populateSubgroupFilter();
    renderHistory();
  } else {
    historyView.classList.remove('view-active');
    evalView.classList.add('view-active');
  }
}

function buildRubricUI() {
  if (!rubricContainer || !summaryTbody) return;
  rubricContainer.innerHTML = '';
  summaryTbody.innerHTML = '';
  
  criteriaList.forEach(c => {
    const row = document.createElement('div');
    row.className = 'rubric-row';
    row.innerHTML = `
      <div class="rubric-title-container">
        <div class="rubric-title">${c.id}. ${c.name}</div>
        <div class="info-icon-container">
          <span class="info-icon">i</span>
          <div class="tooltip-content">
            <strong>${c.name} · Guía</strong>
            <ul>
              <li>Excelente (4) ${c.guide[4]}</li>
              <li>Bueno (3) ${c.guide[3]}</li>
              <li>Satisfactorio (2) ${c.guide[2]}</li>
              <li>Deficiente (1) ${c.guide[1]}</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="rubric-weight">${c.weight}%</div>
      <div class="rubric-options" data-id="${c.id}">
        <button type="button" onclick="setScore(${c.id}, 4, 'Excelente')">Excelente (4)</button>
        <button type="button" onclick="setScore(${c.id}, 3, 'Bueno')">Bueno (3)</button>
        <button type="button" onclick="setScore(${c.id}, 2, 'Satisfactorio')">Satisfactorio (2)</button>
        <button type="button" onclick="setScore(${c.id}, 1, 'Deficiente')">Deficiente (1)</button>
      </div>
      <div class="rubric-result" id="res-${c.id}">-</div>
    `;
    rubricContainer.appendChild(row);

    const tr = document.createElement('tr');
    tr.id = `sum-row-${c.id}`;
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.weight}%</td>
      <td id="sum-pts-${c.id}">0</td>
    `;
    summaryTbody.appendChild(tr);
  });
  
  const totalTr = document.createElement('tr');
  totalTr.innerHTML = `
    <td><strong>Total</strong></td>
    <td><strong>100%</strong></td>
    <td id="total-sum"><strong>0</strong></td>
  `;
  summaryTbody.appendChild(totalTr);
}

window.setScore = function(id, multiplier, label) {
  const optionsDiv = document.querySelector(`.rubric-options[data-id="${id}"]`);
  if (optionsDiv) {
    Array.from(optionsDiv.children).forEach((btn, index) => {
      if (4 - index === multiplier) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  const item = criteriaList.find(c => c.id === id);
  const points = (item.weight * multiplier) / 4;
  
  currentScores[id] = { points, label, multiplier };
  
  const resElem = document.getElementById(`res-${id}`);
  if (resElem) resElem.innerText = `${label} - ${points} pts`;
  const sumElem = document.getElementById(`sum-pts-${id}`);
  if (sumElem) sumElem.innerText = points;

  updateTotals();
};

function updateTotals() {
  let total = 0;
  let evaluatedCount = 0;
  
  criteriaList.forEach(c => {
    if (currentScores[c.id]) {
      total += currentScores[c.id].points;
      evaluatedCount++;
    }
  });
  
  const totalSum = document.getElementById('total-sum');
  if (totalSum) totalSum.innerHTML = `<strong>${total}</strong>`;
  const circScore = document.getElementById('circle-score-val');
  if (circScore) circScore.innerText = total;
  const totScoreText = document.getElementById('total-score-text');
  if (totScoreText) totScoreText.innerText = `${total} puntos`;
  const critCount = document.getElementById('criteria-count');
  if (critCount) critCount.innerText = `${evaluatedCount} de 10 criterios evaluados`;

  const statusText = document.getElementById('status-text');
  if (statusText) {
    if (evaluatedCount === 0) {
      statusText.innerText = "Pendiente";
      statusText.style.color = "#64748b";
    } else if (total >= 90) {
      statusText.innerText = "Aprobado con Distinción";
      statusText.style.color = "#198754";
    } else if (total >= 70) {
      statusText.innerText = "Aprobado";
      statusText.style.color = "#198754";
    } else {
      statusText.innerText = "No Aprobado";
      statusText.style.color = "#dc2626";
    }
  }
}

function renderStudents() {
  if (!studentTagsContainer) return;
  studentTagsContainer.innerHTML = '';
  currentStudents.forEach((student, index) => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `${student} <span onclick="removeStudent(${index})">✕</span>`;
    studentTagsContainer.appendChild(tag);
  });
}

window.removeStudent = function(index) {
  currentStudents.splice(index, 1);
  renderStudents();
};

function openEvaluation(id) {
  currentScores = {};
  
  document.querySelectorAll('.rubric-options button').forEach(b => b.classList.remove('selected'));
  criteriaList.forEach(c => {
    const resElem = document.getElementById(`res-${c.id}`);
    if (resElem) resElem.innerText = '-';
    const sumElem = document.getElementById(`sum-pts-${c.id}`);
    if (sumElem) sumElem.innerText = '0';
  });
  
  if (id) {
    currentEvalId = id;
    const ev = evaluations.find(e => String(e.id) === String(id));
    if (ev) {
      document.getElementById('input-subgroup').value = ev.subgroup || '';
      document.getElementById('input-team').value = ev.team || '';
      document.getElementById('text-strengths').value = ev.strengths || '';
      document.getElementById('text-weaknesses').value = ev.weaknesses || '';
      
      currentStudents = Array.isArray(ev.students) ? [...ev.students] : [];
      
      if (ev.scores) {
        for (const critId in ev.scores) {
          setScore(parseInt(critId), ev.scores[critId].multiplier, ev.scores[critId].label);
        }
      }
    }
  } else {
    currentEvalId = null;
    document.getElementById('input-subgroup').value = '';
    document.getElementById('input-team').value = '';
    document.getElementById('text-strengths').value = '';
    document.getElementById('text-weaknesses').value = '';
    currentStudents = [];
    updateTotals();
  }
  
  renderStudents();
  switchView('eval');
}

async function saveEvaluation() {
  // incluir alumno pendiente si no presiono enter
  if (inputStudent && inputStudent.value.trim() !== '') {
    currentStudents.push(inputStudent.value.trim());
    inputStudent.value = '';
    renderStudents();
  }

  let totalScore = 0;
  for (const key in currentScores) {
    totalScore += currentScores[key].points;
  }

  const evalData = {
    id: currentEvalId,
    caseId: activeCaseId || '1',
    caseName: activeCaseName || 'Caso Clinico',
    date: new Date().toLocaleDateString('es-MX'),
    subgroup: document.getElementById('input-subgroup').value.trim() || 'N/A',
    team: document.getElementById('input-team').value.trim() || 'N/A',
    students: currentStudents,
    scores: currentScores,
    total: totalScore,
    strengths: document.getElementById('text-strengths').value.trim(),
    weaknesses: document.getElementById('text-weaknesses').value.trim()
  };

  // guardar en base de datos
  try {
    const res = await fetch('BE/guardar_evaluacion.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evalData)
    });
    if (res.ok) {
      const respData = await res.json();
      if (respData && respData.success && respData.id) {
        evalData.id = String(respData.id);
      }
    }
  } catch (err) {
    console.log("Modo local:", err);
  }

  // recargar desde base de datos
  await loadEvaluationsFromBackend();
  switchView('history');
}

function populateSubgroupFilter() {
  const filterSelect = document.querySelector('.filter-select');
  if (!filterSelect) return;

  const currentSelection = filterSelect.value;
  filterSelect.innerHTML = '<option value="">Todos los subgrupos</option>';
  
  const subgroups = new Set();
  evaluations.forEach(ev => {
    if (ev.subgroup && ev.subgroup !== 'N/A') {
      subgroups.add(ev.subgroup);
    }
  });

  subgroups.forEach(sg => {
    const opt = document.createElement('option');
    opt.value = sg;
    opt.textContent = `Subgrupo ${sg}`;
    if (sg === currentSelection) opt.selected = true;
    filterSelect.appendChild(opt);
  });
}

function renderHistory() {
  if (!historyTbody) return;
  historyTbody.innerHTML = '';
  
  const searchInput = document.querySelector('.search-input');
  const filterSelect = document.querySelector('.filter-select');

  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filterSubgroup = filterSelect ? filterSelect.value : '';

  // filtrar por caso actual si existe id
  let filteredList = evaluations.filter(ev => {
    if (activeCaseId && activeCaseId !== '' && ev.caseId && String(ev.caseId) !== String(activeCaseId)) {
      return false;
    }
    if (filterSubgroup && ev.subgroup !== filterSubgroup) {
      return false;
    }
    if (searchTerm) {
      const teamMatch = String(ev.team || '').toLowerCase().includes(searchTerm);
      const subMatch = String(ev.subgroup || '').toLowerCase().includes(searchTerm);
      const studentMatch = (ev.students || []).some(st => String(st).toLowerCase().includes(searchTerm));
      if (!teamMatch && !subMatch && !studentMatch) return false;
    }
    return true;
  });

  const evalCountElem = document.getElementById('eval-count');
  if (evalCountElem) evalCountElem.innerText = `Mostrando ${filteredList.length} equipos evaluados`;

  if (filteredList.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="6" style="text-align: center; color: var(--text-muted, #666); padding: 32px;">No hay evaluaciones registradas para este caso. Haz clic en "Calificar Nuevo Equipo" para agregar una.</td>`;
    historyTbody.appendChild(tr);
    return;
  }

  filteredList.forEach(ev => {
    const tr = document.createElement('tr');
    
    let studentsText = (ev.students || []).join(', ');
    if (studentsText.length > 30) studentsText = studentsText.substring(0, 30) + '...';
    if (studentsText === '') studentsText = 'Sin integrantes';

    tr.innerHTML = `
      <td>${ev.date}</td>
      <td>${ev.subgroup}</td>
      <td>${ev.team}</td>
      <td>${studentsText}</td>
      <td><span class="score-badge-table">${ev.total}</span></td>
      <td class="action-links">
        <button type="button" onclick="openEvaluation('${ev.id}')">Ver</button>
        <button type="button" onclick="deleteEvaluation('${ev.id}')">Eliminar</button>
      </td>
    `;
    historyTbody.appendChild(tr);
  });
}

// pantalla emergente de confirmacion formal estilo cimed (evita popups nativos "localhost dice")
function showCustomConfirm({
  title = '¿Confirmar acción?',
  message = '¿Estás seguro de que deseas continuar?',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isWarning = false
} = {}) {
  return new Promise((resolve) => {
    let modal = document.getElementById('eval-confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'eval-confirm-modal';
      modal.className = 'eval-confirm-overlay';
      modal.innerHTML = `
        <div class="eval-confirm-backdrop"></div>
        <div class="eval-confirm-card" role="dialog" aria-modal="true">
          <div class="eval-confirm-icon" id="eval-confirm-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3 id="eval-confirm-title"></h3>
          <p id="eval-confirm-message"></p>
          <div class="eval-confirm-actions">
            <button type="button" class="btn-confirm-cancel" id="eval-confirm-btn-cancel"></button>
            <button type="button" class="btn-confirm-delete" id="eval-confirm-btn-ok"></button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const titleEl = modal.querySelector('#eval-confirm-title');
    const msgEl = modal.querySelector('#eval-confirm-message');
    const btnCancel = modal.querySelector('#eval-confirm-btn-cancel');
    const btnOk = modal.querySelector('#eval-confirm-btn-ok');
    const iconEl = modal.querySelector('#eval-confirm-icon');
    const backdrop = modal.querySelector('.eval-confirm-backdrop');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (btnCancel) btnCancel.textContent = cancelText;
    if (btnOk) btnOk.textContent = confirmText;

    if (iconEl) {
      if (isWarning) {
        iconEl.classList.add('warning');
      } else {
        iconEl.classList.remove('warning');
      }
    }

    modal.style.display = 'flex';

    function cleanup(result) {
      modal.style.display = 'none';
      if (btnCancel) btnCancel.removeEventListener('click', onCancel);
      if (btnOk) btnOk.removeEventListener('click', onOk);
      if (backdrop) backdrop.removeEventListener('click', onCancel);
      document.removeEventListener('keydown', onKey);
      resolve(result);
    }

    function onCancel() {
      cleanup(false);
    }

    function onOk() {
      cleanup(true);
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        cleanup(false);
      }
    }

    if (btnCancel) btnCancel.addEventListener('click', onCancel);
    if (btnOk) btnOk.addEventListener('click', onOk);
    if (backdrop) backdrop.addEventListener('click', onCancel);
    document.addEventListener('keydown', onKey);

    // Enfoque inicial en Cancelar por proteccion contra errores de dedo
    if (btnCancel) btnCancel.focus();
  });
}

window.deleteEvaluation = async function(id) {
  const confirmed = await showCustomConfirm({
    title: '¿Eliminar evaluación del equipo?',
    message: 'Esta evaluación será eliminada de forma permanente del historial de este caso clínico. Esta acción no se puede deshacer.',
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar',
    isWarning: false
  });

  if (!confirmed) return;

  try {
    await fetch('BE/delete_evaluacion.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    });
  } catch (err) {
    console.log("Error al eliminar del servidor:", err);
  }
  evaluations = evaluations.filter(e => String(e.id) !== String(id));
  localStorage.setItem('cimed_evaluations', JSON.stringify(evaluations));
  populateSubgroupFilter();
  renderHistory();
};

async function clearAllEvaluations() {
  const caseDesc = activeCaseName ? ` del caso "${activeCaseName}"` : '';
  const confirmed = await showCustomConfirm({
    title: '¿Limpiar evaluaciones del semestre?',
    message: `Se eliminarán todas las evaluaciones registradas${caseDesc} para este semestre. Esta acción es definitiva y no se puede deshacer.`,
    confirmText: 'Sí, limpiar todo',
    cancelText: 'Cancelar',
    isWarning: true
  });

  if (!confirmed) return;

  const toDelete = activeCaseId 
    ? evaluations.filter(e => e.caseId && String(e.caseId) === String(activeCaseId))
    : [...evaluations];

  for (const ev of toDelete) {
    if (ev.id) {
      try {
        await fetch('BE/delete_evaluacion.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ev.id })
        });
      } catch (err) {
        console.log("Error al eliminar del servidor:", err);
      }
    }
  }

  if (activeCaseId) {
    evaluations = evaluations.filter(e => e.caseId && String(e.caseId) !== String(activeCaseId));
  } else {
    evaluations = [];
  }
  localStorage.setItem('cimed_evaluations', JSON.stringify(evaluations));
  populateSubgroupFilter();
  renderHistory();
}

document.addEventListener('DOMContentLoaded', init);
