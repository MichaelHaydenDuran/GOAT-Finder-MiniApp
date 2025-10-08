/* global $ */
(() => {
  const API = '/api/goats';

  // --- State ---
  const state = {
    page: 1,
    limit: 12,
    sort: '-createdAt',
    q: {}
  };

  // --- Helpers ---
  function toDataURL(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function buildQuery() {
    const params = new URLSearchParams();

    // text fuzzy filters
    if (state.q.name)        params.set('name', state.q.name);
    if (state.q.breed)       params.set('breed', state.q.breed);
    if (state.q.temperament) params.set('temperament', state.q.temperament);

    // numeric ranges
    if (state.q.minPrice)  params.set('minPrice', state.q.minPrice);
    if (state.q.maxPrice)  params.set('maxPrice', state.q.maxPrice);
    if (state.q.minAge)    params.set('minAge', state.q.minAge);
    if (state.q.maxAge)    params.set('maxAge', state.q.maxAge);
    if (state.q.minWeight) params.set('minWeight', state.q.minWeight);
    if (state.q.maxWeight) params.set('maxWeight', state.q.maxWeight);

    // sort/pagination
    params.set('sort', state.sort || '-createdAt');
    params.set('page', state.page);
    params.set('limit', state.limit);

    return params.toString();
  }

  function setForm(goat) {
    $('#goatId').val(goat?._id || '');
    $('#name').val(goat?.name || '');
    $('#breed').val(goat?.breed || '');
    $('#ageYears').val(goat?.ageYears ?? '');
    $('#weightLbs').val(goat?.weightLbs ?? '');
    $('#priceUsd').val(goat?.priceUsd ?? '');
    $('#temperament').val(goat?.temperament || '');
    $('#preview').attr('src', goat?.imageDataUrl || '');
    $('#cancelEditBtn').toggleClass('d-none', !goat);
  }

  function collectForm() {
    return {
      name: $('#name').val().trim(),
      breed: $('#breed').val().trim(),
      ageYears: Number($('#ageYears').val()),
      weightLbs: Number($('#weightLbs').val()),
      priceUsd: Number($('#priceUsd').val()),
      temperament: $('#temperament').val().trim(),
      // imageDataUrl populated during submit if file chosen; otherwise keep current preview src
      imageDataUrl: $('#preview').attr('src') || ''
    };
  }

  function toast(msg, variant='primary') {
    const el = $(
      `<div class="toast align-items-center text-bg-${variant} border-0" role="alert" aria-live="assertive" aria-atomic="true" style="position: fixed; top: 1rem; right: 1rem; z-index: 1080;">
        <div class="d-flex">
          <div class="toast-body">${msg}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>`
    );
    $('body').append(el);
    const t = new bootstrap.Toast(el[0], { delay: 2000 });
    t.show();
    el.on('hidden.bs.toast', () => el.remove());
  }

  // --- API calls ---
  async function fetchList() {
    const qs = buildQuery();
    const url = `${API}?${qs}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`List failed: ${res.status}`);
    const items = await res.json();

    // headers set by controller list()
    const total = Number(res.headers.get('X-Total-Count') || items.length || 0);
    renderList(items, total);
  }

  async function createGoat(payload) {
    const res = await fetch(API, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function updateGoat(id, payload) {
    const res = await fetch(`${API}/${id}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function deleteGoat(id) {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error(`Delete ${id} failed`);
  }

  // --- Rendering ---
  function goatCard(g) {
    const img = g.imageDataUrl || '';
    return `
      <div class="col-12 col-sm-6 col-lg-4">
        <div class="card shadow-sm h-100">
          ${img ? `<img class="goat-img card-img-top" src="${img}" alt="${g.name}">` : `<div class="goat-img"></div>`}
          <div class="card-body d-flex flex-column">
            <h5 class="card-title truncate">${g.name}</h5>
            <div class="mb-2">
              <span class="badge bg-secondary me-1">${g.breed}</span>
              <span class="badge bg-info text-dark me-1">${g.temperament}</span>
            </div>
            <ul class="list-unstyled small mb-3">
              <li><strong>Age:</strong> ${g.ageYears} yrs</li>
              <li><strong>Weight:</strong> ${g.weightLbs} lbs</li>
              <li><strong>Price:</strong> $${g.priceUsd.toLocaleString()}</li>
            </ul>
            <div class="mt-auto d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${g._id}">
                <i class="bi bi-pencil-square"></i> Edit
              </button>
              <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${g._id}">
                <i class="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderList(items, total) {
    $('#listArea').html(items.map(goatCard).join(''));
    $('#totalBadge').text(total);
    $('#pageLabel').text(state.page);

    // prev/next enablement
    const pages = Math.max(1, Math.ceil(total / state.limit));
    $('#prevPageBtn').prop('disabled', state.page <= 1);
    $('#nextPageBtn').prop('disabled', state.page >= pages);
  }

  // --- Event bindings ---
  $('#imageFile').on('change', async function () {
    const file = this.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await toDataURL(file);
      $('#preview').attr('src', dataUrl);
    } catch {
      toast('Could not preview image', 'danger');
    }
  });

  $('#goat-form').on('submit', async (e) => {
    e.preventDefault();
    try {
      const id = $('#goatId').val();
      const payload = collectForm();

      if (id) {
        await updateGoat(id, payload);
        toast('Goat updated', 'success');
      } else {
        await createGoat(payload);
        toast('Goat created', 'success');
      }

      setForm(null);
      $('#imageFile').val('');
      await fetchList();
    } catch (err) {
      toast('Save failed', 'danger');
      // console.error(err);
    }
  });

  $('#resetBtn').on('click', () => {
    setForm(null);
    $('#imageFile').val('');
    $('#preview').attr('src', '');
  });

  $('#cancelEditBtn').on('click', () => {
    setForm(null);
    $('#imageFile').val('');
    $('#preview').attr('src', '');
  });

  $('#listArea').on('click', '.edit-btn', async function () {
    const card = $(this).closest('.card');
    const id = $(this).data('id');

    // quick fetch single goat (could use existing list data; fetch for freshness)
    try {
      const res = await fetch(`${API}/${id}`);
      if (!res.ok) throw new Error('fetch failed');
      const g = await res.json();
      setForm(g);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      toast('Failed to load goat', 'danger');
    }
  });

  $('#listArea').on('click', '.delete-btn', async function () {
    const id = $(this).data('id');
    if (!confirm('Delete this goat?')) return;
    try {
      await deleteGoat(id);
      toast('Goat deleted', 'warning');
      await fetchList();
    } catch {
      toast('Delete failed', 'danger');
    }
  });

  // Filters
  $('#searchBtn').on('click', async () => {
    state.page = 1;
    state.q = {
      name: $('#qName').val().trim(),
      breed: $('#qBreed').val().trim(),
      temperament: $('#qTemperament').val().trim(),
      minPrice: $('#qMinPrice').val(),
      maxPrice: $('#qMaxPrice').val(),
      minAge: $('#qMinAge').val(),
      maxAge: $('#qMaxAge').val(),
      minWeight: $('#qMinWeight').val(),
      maxWeight: $('#qMaxWeight').val()
    };
    state.sort = $('#qSort').val();
    state.limit = Number($('#qLimit').val());
    await fetchList();
  });

  $('#clearFiltersBtn').on('click', async () => {
    $('#qName,#qBreed,#qTemperament,#qMinPrice,#qMaxPrice,#qMinAge,#qMaxAge,#qMinWeight,#qMaxWeight').val('');
    $('#qSort').val('-createdAt');
    $('#qLimit').val('12');
    state.page = 1;
    state.limit = 12;
    state.sort = '-createdAt';
    state.q = {};
    await fetchList();
  });

  $('#qSort, #qLimit').on('change', async () => {
    state.page = 1;
    state.sort = $('#qSort').val();
    state.limit = Number($('#qLimit').val());
    await fetchList();
  });

  $('#prevPageBtn').on('click', async () => {
    if (state.page > 1) {
      state.page -= 1;
      await fetchList();
    }
  });
  $('#nextPageBtn').on('click', async () => {
    state.page += 1;
    await fetchList();
  });

  // --- initial load ---
  (async () => {
    $('#qSort').val(state.sort);
    $('#qLimit').val(String(state.limit));
    await fetchList();
  })();
})();
