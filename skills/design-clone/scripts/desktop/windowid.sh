#!/usr/bin/env bash
# 取某 app 主窗 CGWindowID（供 screencapture -l 窗裁，M18）
# 用法: bash windowid.sh <owner-name-substr>   例: bash windowid.sh WorkBuddy
swift -e 'import CoreGraphics
let q = CommandLine.arguments[1]
let list = CGWindowListCopyWindowInfo(.optionAll, kCGNullWindowID) as? [[String:Any]] ?? []
for w in list {
  let owner = w["kCGWindowOwnerName"] as? String ?? ""
  let b = w["kCGWindowBounds"] as? [String:Any] ?? [:]
  let h = (b["Height"] as? Int) ?? 0
  if owner.contains(q) && h > 400 { print(w["kCGWindowNumber"] ?? ""); break }
}' "$1"
