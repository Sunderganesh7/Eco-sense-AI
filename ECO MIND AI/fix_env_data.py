import os

filepath = 'frontend/src/pages/EnvironmentalData.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Add <> at the beginning of return
content = content.replace('  return (\n    <div className="main-content"', '  return (\n    <>\n      <div className="main-content"')

# 2. Close main-content before the leaf element and add </> at the end
# The original has:
#       </form>
#       
#       {/* Decorative background leaf element exactly as requested */}
content = content.replace(
    '      </form>\n      \n      {/* Decorative',
    '      </form>\n      </div>\n      \n      {/* Decorative'
)

# And at the very end:
#       </div>
#     </div>
#   );
# };
content = content.replace(
    '        </svg>\n      </div>\n    </div>\n  );\n};',
    '        </svg>\n      </div>\n    </>\n  );\n};'
)

with open(filepath, 'w') as f:
    f.write(content)
print("Done")
