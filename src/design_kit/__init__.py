from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("design-kit")
except PackageNotFoundError:
    __version__ = "unknown"
