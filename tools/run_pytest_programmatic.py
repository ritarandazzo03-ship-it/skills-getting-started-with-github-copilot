import sys
import pytest
import json

print('Using python executable:', sys.executable)
print('pytest version:', pytest.__version__)
# Run pytest and capture the exit code
exit_code = pytest.main(['-q', 'tests/test_app.py'])
print('pytest exit code:', exit_code)

