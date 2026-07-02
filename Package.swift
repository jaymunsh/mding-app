// swift-tools-version: 6.3

import PackageDescription

let package = Package(
    name: "mding",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "MdingCore", targets: ["MdingCore"]),
        .executable(name: "MdingApp", targets: ["MdingApp"]),
        .executable(name: "MdingCoreSmokeTests", targets: ["MdingCoreSmokeTests"])
    ],
    targets: [
        .target(name: "MdingCore"),
        .executableTarget(name: "MdingApp", dependencies: ["MdingCore"]),
        .executableTarget(name: "MdingCoreSmokeTests", dependencies: ["MdingCore"])
    ],
    swiftLanguageModes: [.v6]
)
