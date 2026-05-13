// ===== STATE =====
let currentTab = 'b11';
let mode = 'practice'; // 'practice' | 'exam'
let shuffled = { b11: false, b12: false, b13: false, all: false };

// Shuffled question orders per section
let orders = {};

function getDataForTab(tab) {
  if (tab === 'b11') return { mc: MC_B11, tf: TF_B11 };
  if (tab === 'b12') return { mc: MC_B12, tf: TF_B12 };
  if (tab === 'b13') return { mc: MC_B13, tf: TF_B13 };
  if (tab === 'all') return { mc: [...MC_B11, ...MC_B12, ...MC_B13], tf: [...TF_B11, ...TF_B12, ...TF_B13] };
}

function shuffle(arr) {
  const a = [...arr.map((_, i) => i)];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initOrders(tab) {
  const { mc, tf } = getDataForTab(tab);
  orders[tab] = {
    mc: mc.map((_, i) => i),
    tf: tf.map((_, i) => i)
  };
}

// ===== RENDER =====
function renderMC(containerId, questions, orderArr) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  orderArr.forEach((qi, displayIdx) => {
    const q = questions[qi];
    const card = document.createElement('div');
    card.className = 'question-card';
    card.dataset.qi = qi;
    card.dataset.section = containerId;

    const num = document.createElement('div');
    num.className = 'question-num';
    num.textContent = `Câu ${displayIdx + 1}`;
    card.appendChild(num);

    const qtext = document.createElement('div');
    qtext.className = 'question-text';
    qtext.textContent = q.q;
    card.appendChild(qtext);

    const opts = document.createElement('div');
    opts.className = 'options';
    const labels = ['A', 'B', 'C', 'D'];
    q.opts.forEach((opt, oi) => {
      const o = document.createElement('div');
      o.className = 'option';
      o.dataset.oi = oi;
      o.innerHTML = `<span class="option-label">${labels[oi]}.</span><span>${opt}</span>`;
      o.addEventListener('click', () => selectMC(card, oi, q.ans, mode));
      opts.appendChild(o);
    });
    card.appendChild(opts);

    const fb = document.createElement('div');
    fb.className = 'feedback';
    card.appendChild(fb);

    container.appendChild(card);
  });
}

function renderTF(containerId, questions, orderArr) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  orderArr.forEach((qi, displayIdx) => {
    const q = questions[qi];
    const card = document.createElement('div');
    card.className = 'question-card true-false';
    card.dataset.qi = qi;
    card.dataset.section = containerId;

    const num = document.createElement('div');
    num.className = 'question-num';
    num.style.color = '#805ad5';
    num.textContent = `Câu ${displayIdx + 1} (Đúng/Sai)`;
    card.appendChild(num);

    // Source text
    const src = document.createElement('div');
    src.className = 'source-text';
    src.textContent = q.q;
    card.appendChild(src);

    const items = document.createElement('div');
    items.className = 'tf-items';
    const labels = ['a', 'b', 'c', 'd'];
    q.items.forEach((item, ii) => {
      const row = document.createElement('div');
      row.className = 'tf-item';

      const txt = document.createElement('div');
      txt.className = 'tf-item-text';
      txt.innerHTML = `<strong>${labels[ii]})</strong> ${item.text}`;
      row.appendChild(txt);

      const btns = document.createElement('div');
      btns.className = 'tf-btns';

      const btnT = document.createElement('button');
      btnT.className = 'tf-btn';
      btnT.textContent = '✓ Đúng';
      btnT.dataset.choice = 'true';
      btnT.addEventListener('click', () => selectTF(row, btnT, btnF, item.ans, true, mode));

      const btnF = document.createElement('button');
      btnF.className = 'tf-btn';
      btnF.textContent = '✗ Sai';
      btnF.dataset.choice = 'false';
      btnF.addEventListener('click', () => selectTF(row, btnT, btnF, item.ans, false, mode));

      btns.appendChild(btnT);
      btns.appendChild(btnF);
      row.appendChild(btns);
      items.appendChild(row);
    });
    card.appendChild(items);
    container.appendChild(card);
  });
}

// ===== INTERACTION =====
function selectMC(card, chosen, correct, currentMode) {
  if (card.dataset.answered === '1') return;
  const opts = card.querySelectorAll('.option');
  opts.forEach(o => o.style.pointerEvents = 'none');

  if (currentMode === 'practice') {
    card.dataset.answered = '1';
    opts[chosen].classList.add(chosen === correct ? 'correct' : 'wrong');
    if (chosen !== correct) opts[correct].classList.add('correct');
    const fb = card.querySelector('.feedback');
    if (chosen === correct) {
      fb.textContent = '✅ Chính xác!';
      fb.className = 'feedback show correct';
    } else {
      fb.textContent = `❌ Sai rồi! Đáp án đúng là ${['A','B','C','D'][correct]}.`;
      fb.className = 'feedback show wrong';
    }
  } else {
    // exam mode: just mark selection, no reveal
    opts.forEach(o => o.classList.remove('selected'));
    opts[chosen].classList.add('selected');
    card.dataset.chosen = chosen;
    opts.forEach(o => o.style.pointerEvents = '');
    opts[chosen].style.pointerEvents = '';
  }
  updateProgress();
}

function selectTF(row, btnT, btnF, correct, chosen, currentMode) {
  if (row.dataset.answered === '1') return;

  btnT.classList.remove('selected-true', 'selected-false', 'correct-true', 'correct-false', 'wrong-choice');
  btnF.classList.remove('selected-true', 'selected-false', 'correct-true', 'correct-false', 'wrong-choice');

  if (currentMode === 'practice') {
    row.dataset.answered = '1';
    btnT.disabled = true;
    btnF.disabled = true;
    if (chosen === correct) {
      if (chosen) { btnT.classList.add('correct-true'); }
      else { btnF.classList.add('correct-false'); }
    } else {
      if (chosen) { btnT.classList.add('wrong-choice'); btnF.classList.add('correct-false'); }
      else { btnF.classList.add('wrong-choice'); btnT.classList.add('correct-true'); }
    }
  } else {
    row.dataset.chosen = chosen;
    if (chosen) { btnT.classList.add('selected-true'); }
    else { btnF.classList.add('selected-false'); }
  }
  updateProgress();
}

// ===== CHECK ALL (exam mode) =====
function checkAll() {
  const tab = currentTab;
  const { mc, tf } = getDataForTab(tab);
  const suffix = tab === 'all' ? 'all' : tab;

  let total = 0, correct = 0;

  // Check MC
  const mcContainer = document.getElementById(`mc-${suffix}`);
  if (mcContainer) {
    mcContainer.querySelectorAll('.question-card').forEach(card => {
      const qi = parseInt(card.dataset.qi);
      const q = mc[qi];
      const opts = card.querySelectorAll('.option');
      const chosen = parseInt(card.dataset.chosen ?? -1);
      total++;
      opts.forEach(o => o.style.pointerEvents = 'none');
      card.dataset.answered = '1';
      if (chosen >= 0) {
        opts[chosen].classList.remove('selected');
        opts[chosen].classList.add(chosen === q.ans ? 'correct' : 'wrong');
        if (chosen !== q.ans) opts[q.ans].classList.add('correct');
        if (chosen === q.ans) correct++;
      } else {
        opts[q.ans].classList.add('correct');
      }
      const fb = card.querySelector('.feedback');
      if (fb) {
        if (chosen === q.ans) { fb.textContent = '✅ Chính xác!'; fb.className = 'feedback show correct'; }
        else { fb.textContent = `❌ Đáp án đúng: ${['A','B','C','D'][q.ans]}.`; fb.className = 'feedback show wrong'; }
      }
    });
  }

  // Check TF
  const tfContainer = document.getElementById(`tf-${suffix}`);
  if (tfContainer) {
    tfContainer.querySelectorAll('.question-card').forEach(card => {
      const qi = parseInt(card.dataset.qi);
      const q = tf[qi];
      const rows = card.querySelectorAll('.tf-item');
      rows.forEach((row, ii) => {
        const item = q.items[ii];
        const btnT = row.querySelectorAll('.tf-btn')[0];
        const btnF = row.querySelectorAll('.tf-btn')[1];
        const chosen = row.dataset.chosen;
        total++;
        btnT.disabled = true;
        btnF.disabled = true;
        row.dataset.answered = '1';
        btnT.classList.remove('selected-true', 'selected-false');
        btnF.classList.remove('selected-true', 'selected-false');
        if (chosen !== undefined) {
          const chosenBool = chosen === 'true';
          if (chosenBool === item.ans) {
            correct++;
            if (item.ans) btnT.classList.add('correct-true');
            else btnF.classList.add('correct-false');
          } else {
            if (chosenBool) { btnT.classList.add('wrong-choice'); }
            else { btnF.classList.add('wrong-choice'); }
            if (item.ans) btnT.classList.add('correct-true');
            else btnF.classList.add('correct-false');
          }
        } else {
          if (item.ans) btnT.classList.add('correct-true');
          else btnF.classList.add('correct-false');
        }
      });
    });
  }

  // Show score
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const scoreBox = document.getElementById('score-box');
  document.getElementById('score-num').textContent = `${correct}/${total}`;
  let emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📖';
  document.getElementById('score-label').textContent = `${emoji} Bạn đạt ${pct}% – ${pct >= 80 ? 'Xuất sắc!' : pct >= 60 ? 'Khá tốt!' : 'Cần ôn thêm!'}`;
  scoreBox.classList.add('show');
  scoreBox.scrollIntoView({ behavior: 'smooth' });
}

// ===== PROGRESS =====
function updateProgress() {
  const tab = currentTab;
  const suffix = tab === 'all' ? 'all' : tab;
  let total = 0, done = 0;

  const mcC = document.getElementById(`mc-${suffix}`);
  if (mcC) {
    mcC.querySelectorAll('.question-card').forEach(c => {
      total++;
      if (c.dataset.answered === '1' || c.dataset.chosen !== undefined) done++;
    });
  }
  const tfC = document.getElementById(`tf-${suffix}`);
  if (tfC) {
    tfC.querySelectorAll('.tf-item').forEach(r => {
      total++;
      if (r.dataset.answered === '1' || r.dataset.chosen !== undefined) done++;
    });
  }

  const bar = document.getElementById('progress-bar');
  const fill = document.getElementById('progress-fill');
  if (total > 0) {
    bar.style.display = 'block';
    fill.style.width = `${Math.round((done / total) * 100)}%`;
  }
}

// ===== CONTROLS =====
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', ['b11','b12','b13','all'][i] === tab);
  });
  document.querySelectorAll('.quiz-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${tab}`).classList.add('active');
  document.getElementById('score-box').classList.remove('show');
  document.getElementById('progress-bar').style.display = 'none';
  renderTab(tab);
}

function renderTab(tab) {
  if (!orders[tab]) initOrders(tab);
  const { mc, tf } = getDataForTab(tab);
  const suffix = tab === 'all' ? 'all' : tab;
  renderMC(`mc-${suffix}`, mc, orders[tab].mc);
  renderTF(`tf-${suffix}`, tf, orders[tab].tf);
  updateProgress();
}

function setMode(m) {
  mode = m;
  document.getElementById('mode-practice').classList.toggle('active', m === 'practice');
  document.getElementById('mode-exam').classList.toggle('active', m === 'exam');
  document.getElementById('info-bar').textContent = m === 'exam' ? '📝 Làm hết rồi bấm "Kiểm tra tất cả"' : '💡 Bấm vào đáp án để xem ngay kết quả';
  resetAll();
}

function shuffleQuestions() {
  const tab = currentTab;
  if (!orders[tab]) initOrders(tab);
  const { mc, tf } = getDataForTab(tab);
  orders[tab].mc = shuffle(mc);
  orders[tab].tf = shuffle(tf);
  shuffled[tab] = true;
  document.getElementById('score-box').classList.remove('show');
  renderTab(tab);
}

function resetAll() {
  const tab = currentTab;
  initOrders(tab);
  document.getElementById('score-box').classList.remove('show');
  document.getElementById('progress-bar').style.display = 'none';
  renderTab(tab);
}

function retryQuiz() {
  resetAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  setMode('practice');
  renderTab('b11');
  document.getElementById('info-bar').textContent = '💡 Bấm vào đáp án để xem ngay kết quả';
});
