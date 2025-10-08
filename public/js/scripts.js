/* GOAT Finder jQuery CRUD UI
 * Expects the backend to implement:
 *   GET    {GOATS_ENDPOINT}                 -> list (array)
 *   POST   {GOATS_ENDPOINT}                 -> create (object)
 *   PUT    {GOATS_ENDPOINT}/:id             -> update (object)
 *   DELETE {GOATS_ENDPOINT}/:id             -> remove (204)
 *
 * If your route is /api/goats or /goats, change GOATS_ENDPOINT below.
 */
const GOATS_ENDPOINT = '/api/goats'; // <-- change to '/api/goats' if your server mounts there

// ---- helpers ----
const $toastEl = $('#toast');
const toast = new bootstrap.Toast($toastEl[0]);
function showToast(msg) { $('#toastBody').text(msg); toast.show(); }

function dataUrlFromFile(inputEl, previewEl) {
  const f = inputEl.files?.[0];
  return new Promise((resolve) => {
    if (!f) { previewEl && (previewEl.innerHTML = 'No image selected'); return resolve(''); }
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target.result;
      if (previewEl) {
        if (typeof url === 'string' && url.startsWith('data:'))
          previewEl.innerHTML = `<img class="goat-img" src="${url}" alt="preview">`;
        else
          previewEl.innerHTML = 'No image selected';
      }
      resolve(typeof url === 'string' ? url : '');
    };
    reader.readAsDataURL(f);
  });
}

function fmtMoney(n){ return `$${(n ?? 0).toLocaleString()}`; }
function esc(s){ return $('<div>').text(s ?? '').html(); }

// ---- state ----
let GOATS = [];  // in-memory cache of list

// ---- fetch & render ----
async function fetchGoats() {
  const res = await fetch(GOATS_ENDPOINT, { headers: { 'Accept':'application/json' } });
  if (!res.ok) throw new Error(`Failed to load goats: ${res.status}`);
  GOATS = await res.json();
  renderGoats();
}

function renderGoats() {
  const term = $('#searchInput').val()?.toLowerCase().trim();
  let list = [...GOATS];

  if (term) {
    list = list.filter(g =>
      (g.name||'').toLowerCase().includes(term) ||
      (g.breed||'').toLowerCase().includes(term)
    );
  }

  // client-side sort
  const sort = $('#sortSelect').val();
  const by = {
    createdDesc: (a,b)=> new Date(b.createdAt)-new Date(a.createdAt),
    createdAsc:  (a,b)=> new Date(a.createdAt)-new Date(b.createdAt),
    priceAsc:    (a,b)=> (a.priceUsd??0)-(b.priceUsd??0),
    priceDesc:   (a,b)=> (b.priceUsd??0)-(a.priceUsd??0),
    ageAsc:      (a,b)=> (a.ageYears??0)-(b.ageYears??0),
    ageDesc:     (a,b)=> (b.ageYears??0)-(a.ageYears??0),
    weightAsc:   (a,b)=> (a.weightLbs??0)-(b.weightLbs??0),
    weightDesc:  (a,b)=> (b.weightLbs??0)-(a.weightLbs??0),
    nameAsc:     (a,b)=> String(a.name||'').localeCompare(String(b.name||'')),
    nameDesc:    (a,b)=> String(b.name||'').localeCompare(String(a.name||'')),
  }[sort] || ((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));

  list.sort(by);

  const $row = $('#cardsRow').empty();
  if (!list.length) {
    $row.append(`<div class="col-12 text-center text-secondary py-5">No goats found.</div>`);
    return;
  }

  for (const g of list) {
    const img = g.imageDataUrl
      ? `<img class="goat-img" src="${esc(g.imageDataUrl)}" alt="${esc(g.name)}">`
      : `<div class="placeholder-img"><i class="bi bi-image me-2"></i>No photo</div>`;

    const card = `
      <div class="col-12 col-sm-6 col-lg-4">
        <div class="card h-100 border-secondary">
          <div class="card-body d-flex flex-column">
            ${img}
            <h5 class="mt-3 mb-1">${esc(g.name)} <span class="badge badge-soft ms-1">${esc(g.breed)}</span></h5>
            <div class="text-secondary small mb-2">Added ${new Date(g.createdAt).toLocaleString()}</div>
            <ul class="list-unstyled mb-3">
              <li><i class="bi bi-tag me-2"></i><strong>Price:</strong> ${fmtMoney(g.priceUsd)}</li>
              <li><i class="bi bi-activity me-2"></i><strong>Age:</strong> ${esc(g.ageYears)} years</li>
              <li><i class="bi bi-weight me-2"></i><strong>Weight:</strong> ${esc(g.weightLbs)} lbs</li>
              <li><i class="bi bi-emoji-smile me-2"></i><strong>Temperament:</strong> ${esc(g.temperament)}</li>
            </ul>
            <div class="mt-auto d-flex gap-2">
              <button class="btn btn-outline-light flex-fill" data-action="edit" data-id="${g._id}"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-outline-danger flex-fill" data-action="delete" data-id="${g._id}"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>
      </div>`;
    $row.append(card);
  }
}

// ---- create ----
$('#createImage').on('change', async (e) => {
  await dataUrlFromFile(e.target, document.getElementById('createPreview'));
});

$('#createSubmit').on('click', async () => {
  const $form = $('#createForm');
  if (!$form[0].checkValidity()) { $form[0].reportValidity(); return; }

  const payload = Object.fromEntries(new FormData($form[0]).entries());
  // convert numerics
  ['ageYears','weightLbs','priceUsd'].forEach(k => payload[k] = Number(payload[k]));

  // image
  const fileInput = document.getElementById('createImage');
  if (fileInput.files?.length) {
    payload.imageDataUrl = await dataUrlFromFile(fileInput, document.getElementById('createPreview'));
  } else {
    payload.imageDataUrl = '';
  }

  try {
    const res = await fetch(GOATS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Create failed: ${res.status} ${errText}`);
    }
    const created = await res.json();
    $('#createModal').modal('hide');
    $('#createForm')[0].reset();
    document.getElementById('createPreview').innerHTML = 'No image selected';
    GOATS.unshift(created); // API sorts by createdAt desc, but we ensure immediate UI add
    renderGoats();
    showToast('Goat created.');
  } catch (e) {
    console.error(e);
    showToast(e.message || 'Create failed.');
  }
});

// ---- edit (open modal) ----
$('#cardsRow').on('click', 'button[data-action="edit"]', (e) => {
  const id = e.currentTarget.dataset.id;
  const g = GOATS.find(x => x._id === id);
  if (!g) return;
  const $f = $('#editForm');
  $f.find('[name="id"]').val(g._id);
  $f.find('[name="name"]').val(g.name);
  $f.find('[name="breed"]').val(g.breed);
  $f.find('[name="ageYears"]').val(g.ageYears);
  $f.find('[name="weightLbs"]').val(g.weightLbs);
  $f.find('[name="priceUsd"]').val(g.priceUsd);
  $f.find('[name="temperament"]').val(g.temperament);
  const prev = document.getElementById('editPreview');
  if (g.imageDataUrl) prev.innerHTML = `<img class="goat-img" src="${g.imageDataUrl}" alt="current">`;
  else prev.innerHTML = 'No image selected';
  $('#editModal').modal('show');
});

// ---- update (submit) ----
$('#editImage').on('change', async (e) => {
  await dataUrlFromFile(e.target, document.getElementById('editPreview'));
});

$('#editSubmit').on('click', async () => {
  const $f = $('#editForm');
  if (!$f[0].checkValidity()) { $f[0].reportValidity(); return; }

  const id = $f.find('[name="id"]').val();
  const payload = Object.fromEntries(new FormData($f[0]).entries());
  delete payload.id;
  // numeric fields
  ['ageYears','weightLbs','priceUsd'].forEach(k => payload[k] = Number(payload[k]));

  // optional image replacement
  const editInput = document.getElementById('editImage');
  if (editInput.files?.length) {
    payload.imageDataUrl = await dataUrlFromFile(editInput, document.getElementById('editPreview'));
  } else {
    // keep current image by NOT sending imageDataUrl
    // (controller treats missing keys as unchanged)
    delete payload.imageDataUrl;
  }

  try {
    const res = await fetch(`${GOATS_ENDPOINT}/${encodeURIComponent(id)}`, {
      method: 'PUT', // controller supports findByIdAndUpdate; PUT is common here
      headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Update failed: ${res.status} ${errText}`);
    }
    const updated = await res.json();
    // update cache
    const idx = GOATS.findIndex(x => x._id === id);
    if (idx >= 0) GOATS[idx] = updated;
    renderGoats();
    $('#editModal').modal('hide');
    editInput.value = '';
    showToast('Goat updated.');
  } catch (e) {
    console.error(e);
    showToast(e.message || 'Update failed.');
  }
});

// ---- delete ----
$('#cardsRow').on('click', 'button[data-action="delete"]', async (e) => {
  const id = e.currentTarget.dataset.id;
  if (!confirm('Delete this goat? This cannot be undone.')) return;
  try {
    const res = await fetch(`${GOATS_ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.status !== 204 && !res.ok) {
      const errText = await res.text();
      throw new Error(`Delete failed: ${res.status} ${errText}`);
    }
    GOATS = GOATS.filter(x => x._id !== id);
    renderGoats();
    showToast('Goat deleted.');
  } catch (e) {
    console.error(e);
    showToast(e.message || 'Delete failed.');
  }
});

// ---- sort & search ----
$('#sortSelect').on('change', renderGoats);
$('#searchInput').on('input', renderGoats);
$('#refreshBtn').on('click', async ()=>{
  try { await fetchGoats(); showToast('List refreshed.'); }
  catch(e) { console.error(e); showToast('Refresh failed.'); }
});

// ---- boot ----
$(async function() {
  try {
    await fetchGoats();
    showToast('Loaded goats.');
  } catch (e) {
    console.error(e);
    showToast('Failed to load goats. Check GOATS_ENDPOINT or server.');
  }
});
