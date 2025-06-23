// This file renders the team structure from a JSON file in a tree format.

document.addEventListener('DOMContentLoaded', function () {
    fetch('/static/data/team.json')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('team-structure');
            container.innerHTML = renderNode(data, true);
        });

    // Recursive render
    function renderNode(node, isRoot = false) {
        let html = `<div class="team-node${isRoot ? ' team-root' : ''}">
            <div class="team-title">${node.title || node.role || 'Member'}</div>
            <div class="team-name">${node.name || ''}</div>
        `;
        if (node.children && node.children.length) {
            html += `<div class="team-children">`;
            node.children.forEach(child => {
                html += renderNode(child, false);
            });
            html += `</div>`;
        }
        html += `</div>`;
        return html;
    }
});