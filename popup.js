document.addEventListener('DOMContentLoaded', function () {
    // Form elements
    const groupNameInput = document.getElementById('group-name');
    const createGroupButton = document.getElementById('create-group');
    const groupSelect = document.getElementById('group-select');
    const patternInput = document.getElementById('pattern');
    const redirectInput = document.getElementById('redirect');
    const enabledCheckbox = document.getElementById('enabled');
    const saveButton = document.getElementById('save');
    const cancelButton = document.getElementById('cancel');
    const clearFormButton = document.getElementById('clear-form');
    const clearButton = document.getElementById('clear');
    const groupsListDiv = document.getElementById('groups-list');
    const editingRuleIdInput = document.getElementById('editing-rule-id');

    // Load saved data
    loadData();

    // Save form data to storage when values change
    patternInput.addEventListener('input', saveFormData);
    redirectInput.addEventListener('input', saveFormData);
    groupSelect.addEventListener('change', saveFormData);
    enabledCheckbox.addEventListener('change', saveFormData);

    // Load form data from storage
    loadFormData();

    // Create group button handler
    createGroupButton.addEventListener('click', function () {
        const groupName = groupNameInput.value.trim();
        if (!groupName) {
            alert('Please enter a group name');
            return;
        }

        chrome.storage.local.get(['groups'], function (result) {
            const groups = result.groups || [];

            // Check if group already exists
            if (groups.find(g => g.name === groupName)) {
                alert('Group with this name already exists');
                return;
            }

            const newGroup = {
                id: Date.now(),
                name: groupName,
                enabled: true,
                rules: []
            };

            groups.push(newGroup);
            groupNameInput.value = '';

            chrome.storage.local.set({ groups: groups }, function () {
                loadData();
                alert('Group created successfully!');
            });
        });
    });

    // Save rule button handler
    saveButton.addEventListener('click', function () {
        const selectedGroupId = groupSelect.value;
        const pattern = patternInput.value.trim();
        const redirect = redirectInput.value.trim();
        const enabled = enabledCheckbox.checked;
        const editingRuleId = editingRuleIdInput.value;

        if (!selectedGroupId) {
            alert('Please select a group');
            return;
        }

        if (!pattern) {
            alert('Please enter text to match in the URL');
            patternInput.focus();
            return;
        }

        if (!redirect) {
            alert('Please enter the redirect URL');
            redirectInput.focus();
            return;
        }

        chrome.storage.local.get(['groups'], function (result) {
            const groups = result.groups || [];
            const groupIndex = groups.findIndex(g => g.id == selectedGroupId);

            if (groupIndex === -1) {
                alert('Selected group not found');
                return;
            }

            if (editingRuleId) {
                // Editing existing rule
                const ruleIndex = groups[groupIndex].rules.findIndex(rule => rule.id == editingRuleId);
                if (ruleIndex !== -1) {
                    groups[groupIndex].rules[ruleIndex] = {
                        id: parseInt(editingRuleId),
                        pattern: pattern,
                        redirect: redirect,
                        enabled: enabled
                    };
                }
            } else {
                // Creating new rule
                const newRule = {
                    id: Date.now(),
                    pattern: pattern,
                    redirect: redirect,
                    enabled: enabled
                };
                groups[groupIndex].rules.push(newRule);
            }

            chrome.storage.local.set({ groups: groups }, function () {
                // Update background script
                chrome.runtime.sendMessage({ action: 'updateGroups', groups: groups });

                // Only clear form if creating a new rule (not editing)
                if (!editingRuleId) {
                    clearForm();
                } else {
                    exitEditMode();
                }
                loadData();

                alert(editingRuleId ? 'Rule updated successfully!' : 'Rule saved successfully!');
            });
        });
    });

    // Cancel button handler
    cancelButton.addEventListener('click', function () {
        clearForm();
        exitEditMode();
    });

    // Clear form button handler
    clearFormButton.addEventListener('click', function () {
        clearForm();
        exitEditMode();
    });

    // Clear all button handler
    clearButton.addEventListener('click', function () {
        if (confirm('Are you sure you want to clear all groups and rules?')) {
            chrome.storage.local.set({ groups: [] }, function () {
                chrome.runtime.sendMessage({ action: 'updateGroups', groups: [] });
                loadData();
            });
        }
    });

    // Load and display data
    function loadData() {
        chrome.storage.local.get(['groups'], function (result) {
            const groups = result.groups || [];

            // Update group selector
            updateGroupSelector(groups);

            // Display groups
            displayGroups(groups);
        });
    }

    // Update group selector dropdown
    function updateGroupSelector(groups) {
        groupSelect.innerHTML = '<option value="">Select a group</option>';
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            groupSelect.appendChild(option);
        });
    }

    // Display groups
    function displayGroups(groups) {
        groupsListDiv.innerHTML = '';

        if (groups.length === 0) {
            groupsListDiv.innerHTML = '<p class="no-groups">No groups created</p>';
            return;
        }

        groups.forEach(group => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'group-item';
            groupDiv.innerHTML = `
                <div class="group-header ${!group.enabled ? 'disabled' : ''}" data-group-id="${group.id}">
                    <div class="group-info">
                        <h4>${escapeHtml(group.name)}</h4>
                        <span class="rule-count">${group.rules.length} rules</span>
                    </div>
                    <div class="group-actions">
                        <button class="toggle-group" data-id="${group.id}">
                            ${group.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button class="edit-group" data-id="${group.id}">Edit</button>
                        <button class="delete-group" data-id="${group.id}">Delete</button>
                    </div>
                </div>
                <div class="group-rules">
                    ${group.rules.map(rule => `
                        <div class="rule-item ${group.enabled && rule.enabled ? 'enabled' : 'disabled'}">
                            <div class="rule-content">
                                <div class="rule-pattern"><strong>Pattern:</strong> ${escapeHtml(rule.pattern)}</div>
                                <div class="rule-redirect"><strong>Redirect:</strong> ${escapeHtml(rule.redirect)}</div>
                            </div>
                            <div class="rule-actions">
                                <button class="edit-rule" data-group-id="${group.id}" data-rule-id="${rule.id}">Edit</button>
                                <button class="delete-rule" data-group-id="${group.id}" data-rule-id="${rule.id}">Delete</button>
                                <button class="toggle-rule" data-group-id="${group.id}" data-rule-id="${rule.id}">${rule.enabled ? 'Disable' : 'Enable'}</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            groupsListDiv.appendChild(groupDiv);
        });

        // Add event listeners
        addGroupEventListeners();
        addRuleEventListeners();
    }


    // Add event listeners for group actions
    function addGroupEventListeners() {
        // Group header click for collapse/expand
        document.querySelectorAll('.group-header').forEach(header => {
            header.addEventListener('click', function (e) {
                // Don't collapse if clicking on buttons
                if (e.target.tagName === 'BUTTON') return;

                const groupId = parseInt(this.dataset.groupId);
                toggleGroupCollapse(groupId);
            });
        });

        document.querySelectorAll('.toggle-group').forEach(button => {
            button.addEventListener('click', function (e) {
                e.stopPropagation(); // Prevent header click
                const groupId = parseInt(this.dataset.id);
                toggleGroup(groupId);
            });
        });

        document.querySelectorAll('.edit-group').forEach(button => {
            button.addEventListener('click', function (e) {
                e.stopPropagation(); // Prevent header click
                const groupId = parseInt(this.dataset.id);
                editGroup(groupId);
            });
        });

        document.querySelectorAll('.delete-group').forEach(button => {
            button.addEventListener('click', function (e) {
                e.stopPropagation(); // Prevent header click
                const groupId = parseInt(this.dataset.id);
                deleteGroup(groupId);
            });
        });
    }

    // Add event listeners for rule actions (within groups)
    function addRuleEventListeners() {
        document.querySelectorAll('.edit-rule').forEach(button => {
            button.addEventListener('click', function () {
                const groupId = parseInt(this.dataset.groupId);
                const ruleId = parseInt(this.dataset.ruleId);
                editRule(groupId, ruleId);
            });
        });

        document.querySelectorAll('.delete-rule').forEach(button => {
            button.addEventListener('click', function () {
                const groupId = parseInt(this.dataset.groupId);
                const ruleId = parseInt(this.dataset.ruleId);
                deleteRule(groupId, ruleId);
            });
        });

        document.querySelectorAll('.toggle-rule').forEach(button => {
            button.addEventListener('click', function () {
                const groupId = parseInt(this.dataset.groupId);
                const ruleId = parseInt(this.dataset.ruleId);
                toggleRule(groupId, ruleId);
            });
        });
    }

    // Toggle group collapse/expand
    function toggleGroupCollapse(groupId) {
        const groupHeader = document.querySelector(`[data-group-id="${groupId}"]`);
        const groupRules = groupHeader.nextElementSibling;

        if (groupHeader.classList.contains('collapsed')) {
            groupHeader.classList.remove('collapsed');
            groupRules.classList.remove('collapsed');
        } else {
            groupHeader.classList.add('collapsed');
            groupRules.classList.add('collapsed');
        }
    }

    // Toggle group enabled/disabled
    function toggleGroup(groupId) {
        chrome.storage.local.get(['groups'], function (result) {
            const groups = result.groups || [];
            const groupIndex = groups.findIndex(g => g.id === groupId);

            if (groupIndex !== -1) {
                groups[groupIndex].enabled = !groups[groupIndex].enabled;
                chrome.storage.local.set({ groups: groups }, function () {
                    chrome.runtime.sendMessage({ action: 'updateGroups', groups: groups });
                    loadData();
                });
            }
        });
    }

    // Edit group
    function editGroup(groupId) {
        chrome.storage.local.get(['groups'], function (result) {
            const groups = result.groups || [];
            const group = groups.find(g => g.id === groupId);

            if (group) {
                const newName = prompt('Enter new group name:', group.name);
                if (newName && newName.trim() !== group.name) {
                    // Check if name already exists
                    if (groups.find(g => g.name === newName.trim() && g.id !== groupId)) {
                        alert('Group name already exists');
                        return;
                    }

                    group.name = newName.trim();
                    chrome.storage.local.set({ groups: groups }, function () {
                        loadData();
                    });
                }
            }
        });
    }

    // Delete group
    function deleteGroup(groupId) {
        if (confirm('Are you sure you want to delete this group and all its rules?')) {
            chrome.storage.local.get(['groups'], function (result) {
                const groups = result.groups || [];
                const updatedGroups = groups.filter(g => g.id !== groupId);

                chrome.storage.local.set({ groups: updatedGroups }, function () {
                    chrome.runtime.sendMessage({ action: 'updateGroups', groups: updatedGroups });
                    loadData();
                });
            });
        }
    }

    // Edit rule
    function editRule(groupId, ruleId) {
        chrome.storage.local.get(['groups'], function (result) {
            const groups = result.groups || [];
            const group = groups.find(g => g.id === groupId);
            const rule = group ? group.rules.find(r => r.id === ruleId) : null;

            if (rule) {
                // Set group selector
                groupSelect.value = groupId;

                // Populate form with rule data
                patternInput.value = rule.pattern;
                redirectInput.value = rule.redirect;
                enabledCheckbox.checked = rule.enabled;
                editingRuleIdInput.value = ruleId;

                // Update UI for edit mode
                saveButton.textContent = 'Update Rule';
                cancelButton.style.display = 'inline-block';

                // Scroll to form
                document.querySelector('.rule-form').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Delete rule
    function deleteRule(groupId, ruleId) {
        if (confirm('Are you sure you want to delete this rule?')) {
            chrome.storage.local.get(['groups'], function (result) {
                const groups = result.groups || [];
                const groupIndex = groups.findIndex(g => g.id === groupId);

                if (groupIndex !== -1) {
                    groups[groupIndex].rules = groups[groupIndex].rules.filter(r => r.id !== ruleId);
                    chrome.storage.local.set({ groups: groups }, function () {
                        chrome.runtime.sendMessage({ action: 'updateGroups', groups: groups });
                        loadData();
                    });
                }
            });
        }
    }

    // Toggle rule enabled/disabled
    function toggleRule(groupId, ruleId) {
        chrome.storage.local.get(['groups'], function (result) {
            const groups = result.groups || [];
            const groupIndex = groups.findIndex(g => g.id === groupId);

            if (groupIndex !== -1) {
                const ruleIndex = groups[groupIndex].rules.findIndex(r => r.id === ruleId);
                if (ruleIndex !== -1) {
                    groups[groupIndex].rules[ruleIndex].enabled = !groups[groupIndex].rules[ruleIndex].enabled;
                    chrome.storage.local.set({ groups: groups }, function () {
                        chrome.runtime.sendMessage({ action: 'updateGroups', groups: groups });
                        loadData();
                    });
                }
            }
        });
    }

    // Clear form
    function clearForm() {
        patternInput.value = '';
        redirectInput.value = '';
        enabledCheckbox.checked = true;
        groupSelect.value = '';
        clearFormData();
    }

    // Exit edit mode
    function exitEditMode() {
        editingRuleIdInput.value = '';
        saveButton.textContent = 'Save Rule';
        cancelButton.style.display = 'none';
    }

    // Save form data to storage
    function saveFormData() {
        const formData = {
            pattern: patternInput.value,
            redirect: redirectInput.value,
            groupId: groupSelect.value,
            enabled: enabledCheckbox.checked
        };
        chrome.storage.local.set({ formData: formData });

        // Show status indicator briefly
        const statusDiv = document.getElementById('form-status');
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 2000);
    }

    // Load form data from storage
    function loadFormData() {
        chrome.storage.local.get(['formData'], function (result) {
            if (result.formData) {
                const data = result.formData;
                patternInput.value = data.pattern || '';
                redirectInput.value = data.redirect || '';
                groupSelect.value = data.groupId || '';
                enabledCheckbox.checked = data.enabled !== false;
            }
        });
    }

    // Clear form data from storage
    function clearFormData() {
        chrome.storage.local.remove(['formData']);
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});