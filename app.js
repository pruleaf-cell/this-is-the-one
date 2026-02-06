const searchInput = document.querySelector('#search-input');
const randomButton = document.querySelector('#random-btn');
const resultsList = document.querySelector('#results-list');
const resultCount = document.querySelector('#result-count');
const detailPanel = document.querySelector('#detail-panel');

const setResultCount = (message) => {
  resultCount.textContent = message;
};

let lexicon = [];
let filtered = [];
let selectedId = null;

const normalize = (value = '') => value.toLowerCase().trim();
const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildSearchHaystack = (entry) =>
  [
    entry.word,
    entry.meaning,
    entry.pieRoot,
    entry.pos,
    ...(entry.cognates || []),
    ...(entry.etymologyChain || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const filterEntries = (query) => {
  const normalized = normalize(query);
  if (!normalized) {
    return [...lexicon].sort((a, b) => a.word.localeCompare(b.word));
  }

  return lexicon
    .filter((entry) => buildSearchHaystack(entry).includes(normalized))
    .sort((a, b) => a.word.localeCompare(b.word));
};

const getEntryById = (id) => lexicon.find((entry) => entry.id === id);

const renderDetail = (entry) => {
  if (!entry) {
    detailPanel.innerHTML = '<p>Select a word to view details.</p>';
    return;
  }

  const sameRoot = entry.pieRoot
    ? lexicon.filter((item) => item.pieRoot === entry.pieRoot && item.id !== entry.id)
    : [];

  const etymologySteps = entry.etymologyChain || [];
  const etymology = etymologySteps.length
    ? etymologySteps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')
    : '<li>No etymology chain provided.</li>';
  const cognates = (entry.cognates || []).length
    ? `<h3>Cognates</h3><ul class="tag-list">${entry.cognates
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ul>`
    : '<p>No cognates listed.</p>';

  const related = sameRoot.length
    ? `<div class="root-group"><h3>Related by PIE root (${escapeHtml(entry.pieRoot)})</h3><ul class="tag-list">${sameRoot
        .map((item) => `<li>${escapeHtml(item.word)}</li>`)
        .join('')}</ul></div>`
    : '<div class="root-group"><h3>Related by PIE root</h3><p>No related entries in this dataset.</p></div>';

  detailPanel.innerHTML = `
    <article>
      <h2>${escapeHtml(entry.word)}</h2>
      <p>${escapeHtml(entry.meaning)}</p>
      <p class="word-meta">
        ${entry.pos ? `<strong>POS:</strong> ${escapeHtml(entry.pos)}` : ''}
        ${entry.ipa ? ` • <strong>IPA:</strong> ${escapeHtml(entry.ipa)}` : ''}
        ${entry.pieRoot ? ` • <strong>PIE root:</strong> ${escapeHtml(entry.pieRoot)}` : ''}
      </p>
      <h3>Etymology chain</h3>
      <ol class="chain">${etymology}</ol>
      ${cognates}
      ${related}
    </article>
  `;
};

const onSelect = (id, shouldFocus = false) => {
  selectedId = id;
  renderResults();
  renderDetail(getEntryById(id));

  if (shouldFocus) {
    const selectedButton = document.querySelector(`button[data-id="${id}"]`);
    selectedButton?.focus();
  }
};

const renderResults = () => {
  setResultCount(`${filtered.length} result${filtered.length === 1 ? '' : 's'}`);

  if (!filtered.length) {
    resultsList.innerHTML = '<li>No matches found.</li>';
    renderDetail(null);
    return;
  }

  if (!filtered.some((entry) => entry.id === selectedId)) {
    selectedId = filtered[0].id;
  }

  resultsList.innerHTML = filtered
    .map(
      (entry) => `
        <li>
          <button
            type="button"
            class="result-button ${entry.id === selectedId ? 'active' : ''}"
            data-id="${escapeHtml(entry.id)}"
            aria-pressed="${entry.id === selectedId}"
          >
            <strong>${escapeHtml(entry.word)}</strong>
            <span class="word-meta">${escapeHtml(entry.meaning)}</span>
          </button>
        </li>
      `
    )
    .join('');

  renderDetail(getEntryById(selectedId));
};

const chooseRandom = () => {
  if (!filtered.length) return;
  const randomEntry = filtered[Math.floor(Math.random() * filtered.length)];
  onSelect(randomEntry.id, true);
};

const initKeyboardNavigation = () => {
  resultsList.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }

    const buttons = [...resultsList.querySelectorAll('.result-button')];
    if (!buttons.length) {
      return;
    }

    const currentIndex = buttons.findIndex((button) => button.dataset.id === selectedId);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowDown') nextIndex = Math.min(buttons.length - 1, currentIndex + 1);
    if (event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1);
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = buttons.length - 1;

    const nextId = buttons[nextIndex]?.dataset.id;
    if (nextId) {
      event.preventDefault();
      onSelect(nextId, true);
    }
  });
};

const load = async () => {
  const response = await fetch('./data/lexicon.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch lexicon: ${response.status}`);
  }

  lexicon = await response.json();

  filtered = filterEntries('');
  selectedId = filtered[0]?.id || null;

  renderResults();
  initKeyboardNavigation();

  searchInput.addEventListener('input', (event) => {
    filtered = filterEntries(event.target.value);
    renderResults();
  });

  randomButton.addEventListener('click', chooseRandom);

  resultsList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (button) {
      onSelect(button.dataset.id);
    }
  });
};

load().catch(() => {
  setResultCount('Failed to load lexicon data.');
  detailPanel.innerHTML = '<p>Could not load data/lexicon.json.</p>';
});
