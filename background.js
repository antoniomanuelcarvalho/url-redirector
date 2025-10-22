// Background script for URL redirection using declarativeNetRequest API with groups
let groups = [];
let ruleIdCounter = 1;

// Load groups from storage on startup
chrome.storage.local.get(['groups'], function (result) {
    groups = result.groups || [];
    console.log('Loaded groups:', groups);
    updateDeclarativeNetRequestRules();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateGroups') {
        groups = request.groups;
        console.log('Updated groups:', groups);
        updateDeclarativeNetRequestRules();
        sendResponse({ success: true });
    }
});

// Update declarative net request rules
async function updateDeclarativeNetRequestRules() {
    try {
        console.log('Updating declarative net request rules...');

        // Remove all existing rules
        const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
        console.log('Existing rules to remove:', existingRules);

        if (existingRules.length > 0) {
            const ruleIdsToRemove = existingRules.map(rule => rule.id);
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIdsToRemove
            });
            console.log('Removed existing rules:', ruleIdsToRemove);
        }

        // Collect all enabled rules from enabled groups
        const enabledRules = [];
        groups.forEach(group => {
            if (group.enabled) {
                group.rules.forEach(rule => {
                    if (rule.enabled) {
                        enabledRules.push({
                            ...rule,
                            groupName: group.name
                        });
                    }
                });
            }
        });

        console.log('Enabled rules from enabled groups:', enabledRules);

        if (enabledRules.length > 0) {
            const dynamicRules = [];

            for (let rule of enabledRules) {
                // Create a single rule that covers all important resource types
                dynamicRules.push({
                    id: ruleIdCounter++,
                    priority: 1,
                    action: {
                        type: 'redirect',
                        redirect: {
                            url: rule.redirect
                        }
                    },
                    condition: {
                        regexFilter: `.*${escapeRegex(rule.pattern)}.*`,
                        resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'script', 'stylesheet', 'image', 'font', 'media', 'websocket', 'other']
                    }
                });
            }

            console.log('Adding dynamic rules:', dynamicRules);
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: dynamicRules
            });
            console.log('Successfully added rules');
        } else {
            console.log('No enabled rules to add');
        }
    } catch (error) {
        console.error('Error updating declarative net request rules:', error);
    }
}

// Escape special regex characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Handle installation/startup
chrome.runtime.onInstalled.addListener(() => {
    console.log('URL Redirector extension installed');
    updateDeclarativeNetRequestRules();
});

// Handle startup
chrome.runtime.onStartup.addListener(() => {
    console.log('URL Redirector extension started');
    updateDeclarativeNetRequestRules();
});