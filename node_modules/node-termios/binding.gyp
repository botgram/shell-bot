{
  "targets": [
    {
      "target_name": "termios",
      "sources":
        [
          "src/CTermios.cpp",
          "src/CCBuffer.cpp",
          "src/termios_basic.cpp",
          "src/node_termios.cpp"
        ],
      "include_dirs" : ['<!(node -e "require(\'nan\')")'],
      "cflags": ["-std=c++11"]
    }
  ]
}
