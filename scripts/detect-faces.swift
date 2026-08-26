import Foundation
import Vision
import ImageIO
import CoreML

struct Face: Codable {
    let x: Double
    let y: Double
    let width: Double
    let height: Double
    let confidence: Float
}

let folder = URL(fileURLWithPath: CommandLine.arguments[1])
let files = try FileManager.default.contentsOfDirectory(
    at: folder,
    includingPropertiesForKeys: nil
).filter { ["webp", "jpg", "jpeg", "png"].contains($0.pathExtension.lowercased()) }.sorted { $0.lastPathComponent < $1.lastPathComponent }

var output: [String: [Face]] = [:]

for file in files {
    guard let source = CGImageSourceCreateWithURL(file as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        output[file.lastPathComponent] = []
        continue
    }

    let request = VNDetectFaceRectanglesRequest()
    if #available(macOS 14.0, *) {
        if let cpu = MLComputeDevice.allComputeDevices.first(where: {
            if case .cpu = $0 { return true }
            return false
        }) {
            request.setComputeDevice(cpu, for: .main)
        }
    }
    let handler = VNImageRequestHandler(cgImage: image, orientation: .up, options: [:])
    try handler.perform([request])
    output[file.lastPathComponent] = (request.results ?? []).map {
        Face(
            x: $0.boundingBox.origin.x,
            y: $0.boundingBox.origin.y,
            width: $0.boundingBox.width,
            height: $0.boundingBox.height,
            confidence: $0.confidence
        )
    }
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
let data = try encoder.encode(output)
if CommandLine.arguments.count > 2 {
    try data.write(to: URL(fileURLWithPath: CommandLine.arguments[2]))
} else {
    FileHandle.standardOutput.write(data)
}
