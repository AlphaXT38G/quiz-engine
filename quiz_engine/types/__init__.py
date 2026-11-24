"""The question types the build accepts, gathered from one module per family.

Each module defines `TYPES = {name: {"keys": {...}, "check": fn, "files": fn (optional)}}`: the
keys a question of that type may have besides the common ones (`validate.COMMON_KEYS`), a
function returning a problem (a string) or None, and for types showing pictures a function
listing the files they use (load.py checks they exist in the quiz folder). A new type is a
module here plus its runtime file (`runtime/js/types/`); the tests check that both sides know
the same names.
"""

from . import choice, flow, ordering, plot, truefalse

TYPES = {}
for _module in (choice, truefalse, ordering, flow, plot):
    for _name, _spec in _module.TYPES.items():
        assert _name not in TYPES, f"question type {_name} defined twice"
        TYPES[_name] = _spec
