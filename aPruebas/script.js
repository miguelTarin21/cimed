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

let evaluations = JSON.parse(localStorage.getItem('cimed_evaluations')) || [];
let currentEvalId = null;
let currentStudents = [];
let currentScores = {};

const historyView = document.getElementById('history-view');
const evalView = document.getElementById('eval-view');
const historyTbody = document.getElementById('history-tbody');
const rubricContainer = document.getElementById('rubric-container');
const summaryTbody = document.querySelector('#summary-table tbody');
const studentTagsContainer = document.getElementById('student-tags');
const inputStudent = document.getElementById('input-student');

function init() {
  buildRubricUI();
  renderHistory();
  
  document.getElementById('btn-new-eval').addEventListener('click', () => {
    openEvaluation(null);
  });
  
  document.getElementById('btn-back-history').addEventListener('click', () => {
    switchView('history');
  });

  document.getElementById('btn-save-eval').addEventListener('click', saveEvaluation);

  inputStudent.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && inputStudent.value.trim() !== '') {
      currentStudents.push(inputStudent.value.trim());
      inputStudent.value = '';
      renderStudents();
    }
  });
}

function switchView(view) {
  if (view === 'history') {
    evalView.classList.remove('view-active');
    historyView.classList.add('view-active');
    renderHistory();
  } else {
    historyView.classList.remove('view-active');
    evalView.classList.add('view-active');
  }
}

function buildRubricUI() {
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
        <button onclick="setScore(${c.id}, 4, 'Excelente')">Excelente (4)</button>
        <button onclick="setScore(${c.id}, 3, 'Bueno')">Bueno (3)</button>
        <button onclick="setScore(${c.id}, 2, 'Satisfactorio')">Satisfactorio (2)</button>
        <button onclick="setScore(${c.id}, 1, 'Deficiente')">Deficiente (1)</button>
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
  Array.from(optionsDiv.children).forEach((btn, index) => {
    if (4 - index === multiplier) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });

  const item = criteriaList.find(c => c.id === id);
  const points = (item.weight * multiplier) / 4;
  
  currentScores[id] = { points, label, multiplier };
  
  document.getElementById(`res-${id}`).innerText = `${label} - ${points} pts`;
  document.getElementById(`sum-pts-${id}`).innerText = points;

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
  
  document.getElementById('total-sum').innerHTML = `<strong>${total}</strong>`;
  document.getElementById('circle-score-val').innerText = total;
  document.getElementById('total-score-text').innerText = `${total} puntos`;
  document.getElementById('criteria-count').innerText = `${evaluatedCount} de 10 criterios evaluados`;

  const statusText = document.getElementById('status-text');
  if (evaluatedCount === 0) {
      statusText.innerText = "Pendiente";
  } else if (total >= 90) {
      statusText.innerText = "Aprobado con Distinción";
  } else if (total >= 70) {
      statusText.innerText = "Aprobado";
  } else {
      statusText.innerText = "No Aprobado";
  }
}

function renderStudents() {
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
    document.getElementById(`res-${c.id}`).innerText = '-';
    document.getElementById(`sum-pts-${c.id}`).innerText = '0';
  });
  
  if (id) {
    currentEvalId = id;
    const ev = evaluations.find(e => e.id === id);
    document.getElementById('input-subgroup').value = ev.subgroup;
    document.getElementById('input-team').value = ev.team;
    document.getElementById('text-strengths').value = ev.strengths;
    document.getElementById('text-weaknesses').value = ev.weaknesses;
    document.getElementById('check-debriefing').checked = ev.debriefing;
    
    currentStudents = [...ev.students];
    
    for (const critId in ev.scores) {
      setScore(parseInt(critId), ev.scores[critId].multiplier, ev.scores[critId].label);
    }
  } else {
    currentEvalId = Date.now().toString();
    document.getElementById('input-subgroup').value = '';
    document.getElementById('input-team').value = '';
    document.getElementById('text-strengths').value = '';
    document.getElementById('text-weaknesses').value = '';
    document.getElementById('check-debriefing').checked = false;
    currentStudents = [];
    updateTotals();
  }
  
  renderStudents();
  switchView('eval');
}

function saveEvaluation() {
  let totalScore = 0;
  for (const key in currentScores) {
    totalScore += currentScores[key].points;
  }

  const evalData = {
    id: currentEvalId,
    date: new Date().toLocaleDateString('es-MX'),
    subgroup: document.getElementById('input-subgroup').value || 'N/A',
    team: document.getElementById('input-team').value || 'N/A',
    students: currentStudents,
    scores: currentScores,
    total: totalScore,
    strengths: document.getElementById('text-strengths').value,
    weaknesses: document.getElementById('text-weaknesses').value,
    debriefing: document.getElementById('check-debriefing').checked
  };

  const existingIndex = evaluations.findIndex(e => e.id === currentEvalId);
  if (existingIndex > -1) {
    evaluations[existingIndex] = evalData;
  } else {
    evaluations.push(evalData);
  }

  localStorage.setItem('cimed_evaluations', JSON.stringify(evaluations));
  switchView('history');
}

function renderHistory() {
  historyTbody.innerHTML = '';
  document.getElementById('eval-count').innerText = `Mostrando ${evaluations.length} equipos evaluados`;

  evaluations.forEach(ev => {
    const tr = document.createElement('tr');
    
    let studentsText = ev.students.join(', ');
    if(studentsText.length > 30) studentsText = studentsText.substring(0, 30) + '...';
    if(studentsText === '') studentsText = 'Sin integrantes';

    tr.innerHTML = `
      <td>${ev.date}</td>
      <td>${ev.subgroup}</td>
      <td>${ev.team}</td>
      <td>${studentsText}</td>
      <td><span style="border: 1px solid #ccc; padding: 4px 8px; border-radius: 4px;">${ev.total}</span></td>
      <td class="action-links">
        <button onclick="openEvaluation('${ev.id}')">Ver</button>
        <button>PDF</button>
        <button onclick="deleteEvaluation('${ev.id}')">Eliminar</button>
      </td>
    `;
    historyTbody.appendChild(tr);
  });
}

window.deleteEvaluation = function(id) {
  if(confirm('¿Seguro que deseas eliminar esta evaluación?')) {
    evaluations = evaluations.filter(e => e.id !== id);
    localStorage.setItem('cimed_evaluations', JSON.stringify(evaluations));
    renderHistory();
  }
};

document.addEventListener('DOMContentLoaded', init);