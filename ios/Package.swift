// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "BrawlStrategy",
    platforms: [
        .iOS(.v17)
    ],
    targets: [
        .executableTarget(
            name: "BrawlStrategy",
            path: "BrawlStats",
            resources: [
                .process("Assets.xcassets")
            ],
            swiftSettings: [
                .enableUpcomingFeature("BareSlashRegexLiterals"),
                .enableUpcomingFeature("ConciseMagicFile")
            ]
        )
    ]
)
