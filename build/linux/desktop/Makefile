# Alternative GNU Make workspace makefile autogenerated by Premake

ifndef config
  config=debug_x64
endif

ifndef verbose
  SILENT = @
endif

ifeq ($(config),debug_x64)
  usciter_config = debug_x64
  gsciter_config = debug_x64
  inspector_config = debug_x64
  integration_config = debug_x64
  sciter_sqlite_config = debug_x64
  sciter_component_config = debug_x64
  sciter_webview_config = debug_x64
  glfw_opengl_config = debug_x64

else ifeq ($(config),debug_arm32)
  usciter_config = debug_arm32
  gsciter_config = debug_arm32
  inspector_config = debug_arm32
  integration_config = debug_arm32
  sciter_sqlite_config = debug_arm32
  sciter_component_config = debug_arm32
  sciter_webview_config = debug_arm32
  glfw_opengl_config = debug_arm32

else ifeq ($(config),debug_arm64)
  usciter_config = debug_arm64
  gsciter_config = debug_arm64
  inspector_config = debug_arm64
  integration_config = debug_arm64
  sciter_sqlite_config = debug_arm64
  sciter_component_config = debug_arm64
  sciter_webview_config = debug_arm64
  glfw_opengl_config = debug_arm64

else ifeq ($(config),release_x64)
  usciter_config = release_x64
  gsciter_config = release_x64
  inspector_config = release_x64
  integration_config = release_x64
  sciter_sqlite_config = release_x64
  sciter_component_config = release_x64
  sciter_webview_config = release_x64
  glfw_opengl_config = release_x64

else ifeq ($(config),release_arm32)
  usciter_config = release_arm32
  gsciter_config = release_arm32
  inspector_config = release_arm32
  integration_config = release_arm32
  sciter_sqlite_config = release_arm32
  sciter_component_config = release_arm32
  sciter_webview_config = release_arm32
  glfw_opengl_config = release_arm32

else ifeq ($(config),release_arm64)
  usciter_config = release_arm64
  gsciter_config = release_arm64
  inspector_config = release_arm64
  integration_config = release_arm64
  sciter_sqlite_config = release_arm64
  sciter_component_config = release_arm64
  sciter_webview_config = release_arm64
  glfw_opengl_config = release_arm64

else
  $(error "invalid configuration $(config)")
endif

PROJECTS := usciter gsciter inspector integration sciter-sqlite sciter-component sciter-webview glfw-opengl

.PHONY: all clean help $(PROJECTS) 

all: $(PROJECTS)

usciter:
ifneq (,$(usciter_config))
	@echo "==== Building usciter ($(usciter_config)) ===="
	@${MAKE} --no-print-directory -C . -f usciter.make config=$(usciter_config)
endif

gsciter:
ifneq (,$(gsciter_config))
	@echo "==== Building gsciter ($(gsciter_config)) ===="
	@${MAKE} --no-print-directory -C . -f gsciter.make config=$(gsciter_config)
endif

inspector:
ifneq (,$(inspector_config))
	@echo "==== Building inspector ($(inspector_config)) ===="
	@${MAKE} --no-print-directory -C . -f inspector.make config=$(inspector_config)
endif

integration:
ifneq (,$(integration_config))
	@echo "==== Building integration ($(integration_config)) ===="
	@${MAKE} --no-print-directory -C . -f integration.make config=$(integration_config)
endif

sciter-sqlite:
ifneq (,$(sciter_sqlite_config))
	@echo "==== Building sciter-sqlite ($(sciter_sqlite_config)) ===="
	@${MAKE} --no-print-directory -C . -f sciter-sqlite.make config=$(sciter_sqlite_config)
endif

sciter-component:
ifneq (,$(sciter_component_config))
	@echo "==== Building sciter-component ($(sciter_component_config)) ===="
	@${MAKE} --no-print-directory -C . -f sciter-component.make config=$(sciter_component_config)
endif

sciter-webview:
ifneq (,$(sciter_webview_config))
	@echo "==== Building sciter-webview ($(sciter_webview_config)) ===="
	@${MAKE} --no-print-directory -C . -f sciter-webview.make config=$(sciter_webview_config)
endif

glfw-opengl:
ifneq (,$(glfw_opengl_config))
	@echo "==== Building glfw-opengl ($(glfw_opengl_config)) ===="
	@${MAKE} --no-print-directory -C . -f glfw-opengl.make config=$(glfw_opengl_config)
endif

clean:
	@${MAKE} --no-print-directory -C . -f usciter.make clean
	@${MAKE} --no-print-directory -C . -f gsciter.make clean
	@${MAKE} --no-print-directory -C . -f inspector.make clean
	@${MAKE} --no-print-directory -C . -f integration.make clean
	@${MAKE} --no-print-directory -C . -f sciter-sqlite.make clean
	@${MAKE} --no-print-directory -C . -f sciter-component.make clean
	@${MAKE} --no-print-directory -C . -f sciter-webview.make clean
	@${MAKE} --no-print-directory -C . -f glfw-opengl.make clean

help:
	@echo "Usage: make [config=name] [target]"
	@echo ""
	@echo "CONFIGURATIONS:"
	@echo "  debug_x64"
	@echo "  debug_arm32"
	@echo "  debug_arm64"
	@echo "  release_x64"
	@echo "  release_arm32"
	@echo "  release_arm64"
	@echo ""
	@echo "TARGETS:"
	@echo "   all (default)"
	@echo "   clean"
	@echo "   usciter"
	@echo "   gsciter"
	@echo "   inspector"
	@echo "   integration"
	@echo "   sciter-sqlite"
	@echo "   sciter-component"
	@echo "   sciter-webview"
	@echo "   glfw-opengl"
	@echo ""
	@echo "For more information, see https://github.com/premake/premake-core/wiki"