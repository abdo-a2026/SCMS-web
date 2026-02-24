/**
 * SCMS - Pipeline (Kanban) Page
 */

async function renderPipeline(container) {
  const clients = await Store.getClients();

  const columns = [
    { key: 'new',          label: 'جديد',         cls: 'col-new' },
    { key: 'contacted',    label: 'تم التواصل',   cls: 'col-contacted' },
    { key: 'interested',   label: 'مهتم',          cls: 'col-interested' },
    { key: 'negotiation',  label: 'تفاوض',         cls: 'col-negotiation' },
    { key: 'closed',       label: 'مغلق',          cls: 'col-closed' },
    { key: 'lost',         label: 'خسارة',         cls: 'col-lost' },
  ];

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title"><i class="fa-solid fa-diagram-project"></i> خط الأعمال</div>
      <button class="btn btn-primary" onclick="openClientModal()">
        <i class="fa-solid fa-plus"></i> إضافة عميل
      </button>
    </div>
    <div class="kanban-board" id="kanban-board">
      ${columns.map(col => `
        <div class="kanban-col ${col.cls}" id="col-${col.key}"
          data-status="${col.key}"
          ondragover="onDragOver(event)"
          ondrop="onDrop(event, '${col.key}')"
          ondragleave="onDragLeave(event)">
          <div class="kanban-col-header">
            <div class="kanban-col-title">${col.label}</div>
            <span class="kanban-col-count" id="count-${col.key}">
              ${clients.filter(c=>c.status===col.key).length}
            </span>
          </div>
          <div class="kanban-cards" id="cards-${col.key}">
            ${clients.filter(c=>c.status===col.key).map(c => kanbanCard(c)).join('')
              || '<div class="kanban-empty" style="padding:1rem;text-align:center;color:var(--text-muted);font-size:.8rem">لا يوجد عملاء</div>'}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function kanbanCard(c) {
  return `
    <div class="kanban-card"
      id="kcard-${c.id}"
      draggable="true"
      data-id="${c.id}"
      data-status="${c.status}"
      ondragstart="onDragStart(event, '${c.id}')">
      <div class="kanban-card-actions">
        <button class="kanban-card-edit" onclick="openClientModal('${c.id}')">
          <i class="fa-solid fa-pen"></i>
        </button>
      </div>
      <div class="kanban-card-name">${c.fullName}</div>
      <div class="kanban-card-phone">${c.phone}</div>
      ${c.dealValue ? `<div class="kanban-card-value">${c.dealValue.toLocaleString('ar-IQ')} د.ع</div>` : ''}
      <div class="kanban-card-source">${sourceLabel(c.sourceId)}</div>
    </div>
  `;
}

// ---- Drag & Drop ----
let draggedId = null;
let draggedStatus = null;

function onDragStart(event, id) {
  draggedId = id;
  const card = document.getElementById(`kcard-${id}`);
  if (card) {
    draggedStatus = card.dataset.status;
    card.classList.add('dragging');
  }
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', id);
}

function onDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const col = event.currentTarget;
  const cards = col.querySelector('.kanban-cards');
  if (cards) cards.classList.add('drag-over');
}

function onDragLeave(event) {
  const col = event.currentTarget;
  const cards = col.querySelector('.kanban-cards');
  if (cards) cards.classList.remove('drag-over');
}

async function onDrop(event, newStatus) {
  event.preventDefault();
  const col = event.currentTarget;
  const cards = col.querySelector('.kanban-cards');
  if (cards) cards.classList.remove('drag-over');

  if (!draggedId || draggedStatus === newStatus) {
    cleanupDrag();
    return;
  }

  // Update in store
  await Store.updateClientStatus(draggedId, newStatus);

  // Move card in DOM
  const card = document.getElementById(`kcard-${draggedId}`);
  if (card) {
    card.classList.remove('dragging');
    card.dataset.status = newStatus;

    // Remove from old col
    card.remove();

    // Add to new col
    const newCards = document.getElementById(`cards-${newStatus}`);
    if (newCards) {
      // Remove empty message
      const empty = newCards.querySelector('.kanban-empty');
      if (empty) empty.remove();
      newCards.appendChild(card);
    }

    // Update old col count
    const oldCount = document.getElementById(`count-${draggedStatus}`);
    if (oldCount) {
      const n = parseInt(oldCount.textContent) - 1;
      oldCount.textContent = n;
      // Re-add empty if 0
      const oldCards = document.getElementById(`cards-${draggedStatus}`);
      if (oldCards && n === 0 && !oldCards.children.length) {
        oldCards.innerHTML = '<div class="kanban-empty" style="padding:1rem;text-align:center;color:var(--text-muted);font-size:.8rem">لا يوجد عملاء</div>';
      }
    }

    // Update new col count
    const newCount = document.getElementById(`count-${newStatus}`);
    if (newCount) newCount.textContent = parseInt(newCount.textContent) + 1;
  }

  showToast(`تم نقل العميل إلى "${STATUS_LABELS[newStatus]}"`, 'success');
  cleanupDrag();
}

function cleanupDrag() {
  if (draggedId) {
    const card = document.getElementById(`kcard-${draggedId}`);
    if (card) card.classList.remove('dragging');
  }
  draggedId = null;
  draggedStatus = null;
}

document.addEventListener('dragend', cleanupDrag);
