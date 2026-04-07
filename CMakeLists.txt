cmake_minimum_required(VERSION 4.0)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-fetch REQUIRED PATHS node_modules/cmake-fetch)

project(cmake_runtime C)

fetch_package("github:Kitware/CMake@4.3.1")

set(components cmake ctest cpack)

if(WIN32)
  list(APPEND components cmcldeps)
else()
  list(APPEND components ccmake)
endif()

add_custom_target(cmake_runtime ALL DEPENDS ${components})
