import os

filepath = "templates/index.html"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# We need to move the Growth Delta menu item out of the {% if uploaded_image %} block.
# The block ends at line 363 with {% endif %}.
# Growth Delta is:
#                 <li class="menu-item {% if active_tab == 'comparison' %}active{% endif %}" id="menu-comparison">
#                     <button onclick="switchTab('comparison')">
#                         <span>🔄</span> Growth Delta
#                     </button>
#                 </li>

old_block = """                <li class="menu-item {% if active_tab == 'comparison' %}active{% endif %}" id="menu-comparison">
                    <button onclick="switchTab('comparison')">
                        <span>🔄</span> Growth Delta
                    </button>
                </li>"""

if old_block in content:
    # Remove it from its current position
    content = content.replace(old_block + "\n", "")
    
    # Insert it right before Tree Species Detection (which is outside the if block)
    target = """                <li class="menu-item {% if active_tab == 'tree_species' %}active{% endif %}" id="menu-tree_species">
                    <button onclick="switchTab('tree_species')">"""
                    
    content = content.replace(target, old_block + "\n\n" + target)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Moved Growth Delta outside of uploaded_image block")
else:
    print("Could not find the Growth Delta block to move.")
