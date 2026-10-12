import sys
from pathlib import Path

# Let tests import scoring/stats as top-level modules, as analyze.py does.
sys.path.insert(0, str(Path(__file__).parent))
