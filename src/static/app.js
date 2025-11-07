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
    activitiesListEl.innerHTML = '<p>Loading activities...</p>';
    try {
      const res = await fetch('/activities');
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
            ${renderParticipantsList(activity.participants)}
          </div>
        `;
        activitiesListEl.appendChild(card);
      });
    } catch (err) {
      activitiesListEl.innerHTML = '<p class="error">Failed to load activities.</p>';
      console.error(err);
    }
  }

  function renderParticipantsList(participants) {
    if (!participants || participants.length === 0) {
      return '<p class="no-participants"><em>No participants yet.</em></p>';
    }
    const items = participants.map(p => `<li>${escapeHtml(p)}</li>`).join('');
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
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showMessage(err.detail || 'Failed to sign up.', 'error');
        return;
      }
      const body = await res.json().catch(() => ({}));
      showMessage(body.message || 'Signed up successfully!', 'success');
      emailInput.value = '';
      await loadActivities(); // refresh participants list and capacities
    } catch (err) {
      console.error(err);
      showMessage('An unexpected error occurred.', 'error');
    }
  });

  // Initial load
  loadActivities();
});
