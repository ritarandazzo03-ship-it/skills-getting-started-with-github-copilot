document.addEventListener('DOMContentLoaded', () => {
  const activitiesListEl = document.getElementById('activities-list');
  const selectEl = document.getElementById('activity');
  const form = document.getElementById('signup-form');
  const emailInput = document.getElementById('email');
  const messageEl = document.getElementById('message');

  function showMessage(text, type = 'info') {
    messageEl.className = 'message ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : 'info');
    messageEl.textContent = text;
    messageEl.classList.remove('hidden');
    setTimeout(() => { messageEl.classList.add('hidden'); }, 4000);
  }

  async function loadActivities() {
    console.debug('loadActivities: start');
    activitiesListEl.innerHTML = '<p>Loading activities...</p>';
    try {
      const res = await fetch('/activities', { cache: 'no-store' });
      const data = await res.json();

      // Populate select
      selectEl.innerHTML = '<option value="">-- Select an activity --</option>';
      Object.keys(data).forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        selectEl.appendChild(opt);
      });

      // Render cards
      activitiesListEl.innerHTML = '';
      Object.entries(data).forEach(([name, activity]) => {
        const card = document.createElement('div');
        card.className = 'activity-card';
        card.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p class="desc">${escapeHtml(activity.description)}</p>
          <p class="schedule"><strong>Schedule:</strong> ${escapeHtml(activity.schedule)}</p>
          <p class="capacity"><strong>Capacity:</strong> ${activity.participants.length} / ${activity.max_participants}</p>
          <div class="participants-section">
            <h5>Participants (${activity.participants.length})</h5>
            ${renderParticipantsList(activity.participants, name)}
          </div>
        `;
        activitiesListEl.appendChild(card);
      });

      // Attach delete handlers (event delegation)
      activitiesListEl.querySelectorAll('.participant-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          const activityName = btn.dataset.activity;
          const email = btn.dataset.email;
          if (!activityName || !email) return;
          if (!confirm(`Unregister ${email} from ${activityName}?`)) return;
          try {
            const url = '/activities/' + encodeURIComponent(activityName) + '/participants?email=' + encodeURIComponent(email);
            const res = await fetch(url, { method: 'DELETE', cache: 'no-store' });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              showMessage(err.detail || 'Failed to unregister.', 'error');
              return;
            }
            const body = await res.json().catch(() => ({}));
            console.debug('unregister response', body);
            showMessage(body.message || 'Unregistered successfully', 'success');
            await loadActivities();
          } catch (err) {
            console.error(err);
            showMessage('An unexpected error occurred.', 'error');
          }
        });
      });

      console.debug('loadActivities: end');

    } catch (err) {
      activitiesListEl.innerHTML = '<p class="error">Failed to load activities.</p>';
      console.error(err);
    }
  }

  function renderParticipantsList(participants, activityName) {
    if (!participants || participants.length === 0) {
      return '<p class="no-participants"><em>No participants yet.</em></p>';
    }
    const items = participants.map(p => `
      <li>
        <span class="participant-email">${escapeHtml(p)}</span>
        <button type="button" class="participant-delete" data-activity="${escapeHtml(activityName)}" data-email="${escapeHtml(p)}" aria-label="Unregister ${escapeHtml(p)}">✕</button>
      </li>
    `).join('');
    return `<ul class="participants-list">${items}</ul>`;
  }

  // Simple HTML escape to avoid injection in this small app
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function addDeleteHandlerToButton(btn) {
    btn.addEventListener('click', async () => {
      const activityName = btn.dataset.activity;
      const email = btn.dataset.email;
      if (!activityName || !email) return;
      if (!confirm(`Unregister ${email} from ${activityName}?`)) return;
      try {
        const url = '/activities/' + encodeURIComponent(activityName) + '/participants?email=' + encodeURIComponent(email);
        const res = await fetch(url, { method: 'DELETE', cache: 'no-store' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showMessage(err.detail || 'Failed to unregister.', 'error');
          return;
        }
        const body = await res.json().catch(() => ({}));
        console.debug('unregister response', body);
        showMessage(body.message || 'Unregistered successfully', 'success');
        await loadActivities();
      } catch (err) {
        console.error(err);
        showMessage('An unexpected error occurred.', 'error');
      }
    });
  }

  function addParticipantToCard(activityName, email) {
    // Find the activity card by its header text
    const cards = Array.from(document.querySelectorAll('.activity-card'));
    const card = cards.find(c => {
      const h4 = c.querySelector('h4');
      return h4 && h4.textContent.trim() === activityName;
    });
    if (!card) return; // nothing to update

    const participantsSection = card.querySelector('.participants-section');
    if (!participantsSection) return;

    let list = participantsSection.querySelector('.participants-list');
    // If "No participants yet." is present, remove it and create the list
    const noPart = participantsSection.querySelector('.no-participants');
    if (noPart) {
      noPart.remove();
    }
    if (!list) {
      list = document.createElement('ul');
      list.className = 'participants-list';
      participantsSection.appendChild(list);
    }

    // Prevent duplicate entries in DOM
    const exists = Array.from(list.querySelectorAll('.participant-email')).some(s => s.textContent === email);
    if (exists) {
      // still update counts in case they're out of sync
      updateParticipantCounts(card, 0);
      return;
    }

    // Create new list item
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'participant-email';
    span.textContent = email;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'participant-delete';
    btn.dataset.activity = activityName;
    btn.dataset.email = email;
    btn.setAttribute('aria-label', `Unregister ${email}`);
    btn.textContent = '✕';

    li.appendChild(span);
    li.appendChild(btn);
    list.appendChild(li);

    // Wire delete handler for the freshly added button
    addDeleteHandlerToButton(btn);

    // Update UI counts (participants count and capacity display)
    updateParticipantCounts(card, +1);
  }

  // Update visible participants count and capacity on the card
  function updateParticipantCounts(card, delta) {
    // Update participants heading: "Participants (N)"
    const participantsHeader = card.querySelector('.participants-section h5');
    if (participantsHeader) {
      const text = participantsHeader.textContent || '';
      const m = text.match(/Participants\s*\((\d+)\)/);
      if (m) {
        const current = parseInt(m[1], 10);
        participantsHeader.textContent = `Participants (${Math.max(0, current + delta)})`;
      }
    }

    // Update capacity line: "Capacity: X / Y"
    const capEl = card.querySelector('.capacity');
    if (capEl) {
      const text = capEl.textContent || '';
      const m = text.match(/(\d+)\s*\/\s*(\d+)/);
      if (m) {
        const current = parseInt(m[1], 10);
        const max = parseInt(m[2], 10);
        const newCurrent = Math.max(0, current + delta);
        capEl.innerHTML = `<strong>Capacity:</strong> ${newCurrent} / ${max}`;
      }
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const activity = selectEl.value;
    if (!activity || !email) {
      showMessage('Please select an activity and enter an email.', 'error');
      return;
    }
    try {
      const url = '/activities/' + encodeURIComponent(activity) + '/signup?email=' + encodeURIComponent(email);
      const res = await fetch(url, { method: 'POST', cache: 'no-store' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showMessage(err.detail || 'Failed to sign up.', 'error');
        return;
      }
      const body = await res.json().catch(() => ({}));
      console.debug('signup response', body);
      showMessage(body.message || 'Signed up successfully!', 'success');
      emailInput.value = '';

      // Optimistic UI update: add participant immediately so user sees the change
      addParticipantToCard(activity, email);
      // Refresh from server in background to reconcile any differences
      loadActivities();

    } catch (err) {
      console.error(err);
      showMessage('An unexpected error occurred.', 'error');
    }
  });

  // Initial load
  loadActivities();
});
