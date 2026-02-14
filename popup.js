// Show the paste section when clicking the "Paste" button
document.getElementById('showPasteBtn').addEventListener('click', function() {
    const pasteSection = document.getElementById('pasteSection');
    pasteSection.style.display = (pasteSection.style.display === 'none') ? 'block' : 'none';
});

// Save text with a title
document.getElementById('saveBtn').addEventListener('click', function() {
    const title = document.getElementById('title').value;
    const text = document.getElementById('clipboard').value;

    if (!title || !text) {
        alert('Both title and text are required!');
        return;
    }

    chrome.storage.sync.get({ clipboardItems: [] }, function(data) {
        const clipboardItems = data.clipboardItems;

        clipboardItems.unshift({ title: title, text: text });

        chrome.storage.sync.set({ clipboardItems: clipboardItems }, function() {
            console.log('Text saved under title: ' + title);
            
            showSuccessMessage();
            
            loadTitles(); 
            document.getElementById('title').value = ''; 
            document.getElementById('clipboard').value = ''; 
            document.getElementById('pasteSection').style.display = 'none'; 
        });
    });
});

// Show success message
function showSuccessMessage() {
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved!';
    saveBtn.style.backgroundColor = '#34a853';
    
    setTimeout(function() {
        saveBtn.textContent = originalText;
        saveBtn.style.backgroundColor = '#1a73e8';
    }, 1000);
}

// Load and display saved titles
function loadTitles() {
    chrome.storage.sync.get({ clipboardItems: [] }, function(data) {
        const clipboardItems = data.clipboardItems;
        const titleList = document.getElementById('titleList');
        titleList.innerHTML = ''; 

        if (clipboardItems.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No saved clips yet. Click Paste to add one!';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#5f6368';
            emptyMessage.style.marginTop = '20px';
            emptyMessage.style.fontSize = '14px';
            titleList.appendChild(emptyMessage);
        }

        clipboardItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.classList.add('title-item');
            li.dataset.index = index;

            const dragHandle = document.createElement('span');
            dragHandle.classList.add('drag-handle');
            dragHandle.innerHTML = '⋮⋮';
            dragHandle.draggable = true;

            dragHandle.addEventListener('dragstart', function(e) {
                handleDragStart.call(li, e);
            });
            dragHandle.addEventListener('dragend', function(e) {
                handleDragEnd.call(li, e);
            });

            li.addEventListener('dragover', handleDragOver);
            li.addEventListener('drop', handleDrop);

            const titleSpan = document.createElement('span');
            titleSpan.textContent = item.title;
            titleSpan.classList.add('title-text');
            titleSpan.title = item.title; 
            titleSpan.addEventListener('click', function() {
                copyToClipboardWithEffect(item.text, titleSpan);
            });

            const editButton = document.createElement('button');
            editButton.classList.add('icon-btn');
            editButton.innerHTML = `<img src="images/edit.png" alt="Edit" class="icon">`;
            editButton.addEventListener('click', function() {
                editClipboardItem(index);
            });

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('icon-btn');
            deleteButton.innerHTML = `<img src="images/delete.png" alt="Delete" class="icon">`;
            deleteButton.addEventListener('click', function() {
                deleteClipboardItem(index);
            });

            li.appendChild(dragHandle);
            li.appendChild(titleSpan);
            li.appendChild(editButton); 
            li.appendChild(deleteButton); 
            titleList.appendChild(li);  
        });

        // Add "Rate Us" item at the bottom
        const rateLi = document.createElement('li');
        rateLi.classList.add('title-item', 'rate-item');
        rateLi.draggable = false; 
        
        const starIconLeft = document.createElement('span');
        starIconLeft.innerHTML = '⭐';
        starIconLeft.style.fontSize = '20px';
        starIconLeft.style.marginRight = '5px';
        
        const rateText = document.createElement('span');
        rateText.textContent = 'Rate Us';
        rateText.classList.add('title-text');
        rateText.style.flexGrow = '1';
        rateText.style.textAlign = 'center';
        rateText.style.cursor = 'pointer';
        
        const starIconRight = document.createElement('span');
        starIconRight.innerHTML = '⭐';
        starIconRight.style.fontSize = '20px';
        starIconRight.style.marginLeft = '5px';
        
        rateLi.appendChild(starIconLeft);
        rateLi.appendChild(rateText);
        rateLi.appendChild(starIconRight);
        
        rateLi.addEventListener('click', function() {
            chrome.tabs.create({ 
                url: 'https://microsoftedge.microsoft.com/addons/detail/clipboard/iepgngkiknjnhgfncpbobhlimhkonphl' 
            });
        });
        
        titleList.appendChild(rateLi);
    });
}

// Drag and drop handlers
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const targetElement = e.target.closest('.title-item');
    if (targetElement && targetElement !== draggedElement) {
        targetElement.style.borderTop = '2px solid #1a73e8';
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    const targetElement = e.target.closest('.title-item');
    if (draggedElement !== targetElement) {
        const draggedIndex = parseInt(draggedElement.dataset.index);
        const targetIndex = parseInt(targetElement.dataset.index);

        chrome.storage.sync.get({ clipboardItems: [] }, function(data) {
            const clipboardItems = data.clipboardItems;
            
            const [movedItem] = clipboardItems.splice(draggedIndex, 1);
            
            clipboardItems.splice(targetIndex, 0, movedItem);

            chrome.storage.sync.set({ clipboardItems: clipboardItems }, function() {
                loadTitles();
            });
        });
    }

    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    
    document.querySelectorAll('.title-item').forEach(item => {
        item.style.borderTop = '';
    });
}

// Copy text to clipboard and show "Copied" effect
function copyToClipboardWithEffect(text, titleSpan) {
    navigator.clipboard.writeText(text).then(function() {
        const originalText = titleSpan.textContent;
        titleSpan.textContent = 'Copied';

        setTimeout(function() {
            titleSpan.textContent = originalText;
        }, 300);
    }).catch(function(err) {
        console.error('Could not copy text: ', err);
    });
}

// Edit a clipboard item
function editClipboardItem(index) {
    chrome.storage.sync.get({ clipboardItems: [] }, function(data) {
        const clipboardItems = data.clipboardItems;
        const item = clipboardItems[index];

        document.getElementById('title').value = item.title;
        document.getElementById('clipboard').value = item.text;
        document.getElementById('pasteSection').style.display = 'block';

        clipboardItems.splice(index, 1);
        chrome.storage.sync.set({ clipboardItems: clipboardItems });
        loadTitles();
    });
}

// Delete a clipboard item
function deleteClipboardItem(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        chrome.storage.sync.get({ clipboardItems: [] }, function(data) {
            const clipboardItems = data.clipboardItems;
            clipboardItems.splice(index, 1);
            chrome.storage.sync.set({ clipboardItems: clipboardItems }, function() {
                loadTitles();
            });
        });
    }
}

loadTitles();