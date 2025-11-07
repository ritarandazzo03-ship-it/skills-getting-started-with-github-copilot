import importlib
import traceback

mod = importlib.import_module('tests.test_app')

# call setup if present
if hasattr(mod, 'setup_function'):
    try:
        mod.setup_function()
        print('setup_function OK')
    except Exception:
        print('setup_function FAILED')
        traceback.print_exc()

results = []
for name in dir(mod):
    if name.startswith('test_'):
        func = getattr(mod, name)
        if callable(func):
            try:
                func()
                print(f'{name}: PASS')
                results.append((name, 'PASS'))
            except AssertionError:
                print(f'{name}: FAIL (AssertionError)')
                traceback.print_exc()
                results.append((name, 'FAIL'))
            except Exception:
                print(f'{name}: ERROR')
                traceback.print_exc()
                results.append((name, 'ERROR'))

print('\nSummary:')
for name, status in results:
    print(f' - {name}: {status}')

