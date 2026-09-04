#!/usr/bin/env python3
"""s2c 桥接（M35，opt-in）：复用 env provider key，调本地 screenshot-to-code 生成单文件 HTML。
用法: S2C_DIR=/path/to/screenshot-to-code python3 s2c_gen.py <screenshot.png> [stack]
无 key / 无 S2C → exit 3（调用方回落内置管线）。不新增 key（复用 OPENAI/ANTHROPIC/GEMINI）。"""
import os, sys, base64, asyncio, json

key = os.environ.get("OPENAI_API_KEY") or os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("GEMINI_API_KEY")
s2c = os.environ.get("S2C_DIR", "/tmp/s2c")
if not key or not os.path.isdir(os.path.join(s2c, "backend")):
    sys.exit(3)
sys.path.insert(0, os.path.join(s2c, "backend"))

img = sys.argv[1]
stack = sys.argv[2] if len(sys.argv) > 2 else "html_tailwind"
b64 = base64.b64encode(open(img, "rb").read()).decode()

from agent.runner import Agent
from llm import Llm

result = {"html": ""}

async def send_message(type, text, variant, extra, extra2=None):
    if type == "setCode":
        result["html"] = text

async def main():
    model = Llm.GPT_5_4_MINI_LOW if os.environ.get("OPENAI_API_KEY") else (Llm.CLAUDE_SONNET_4_6 if os.environ.get("ANTHROPIC_API_KEY") else None)
    if model is None:
        sys.exit(3)
    params = {
        "generation_type": "create",
        "input_mode": "image",
        "generated_images": [],
        "image_urls": [f"data:image/png;base64,{b64}"],
        "text_prompt": "",
        "stack": stack,
        "history": [],
    }
    agent = Agent(send_message, 0, os.environ.get("OPENAI_API_KEY"), os.environ.get("OPENAI_BASE_URL"), os.environ.get("ANTHROPIC_API_KEY"), os.environ.get("GEMINI_API_KEY"), os.environ.get("REPLICATE_API_KEY"), None, model, params, None, None, None, None, None)
    await agent.run()

try:
    asyncio.run(main())
except Exception as e:
    print("s2c error:", str(e)[:200], file=sys.stderr)
    sys.exit(3)
if not result["html"]:
    sys.exit(3)
print(result["html"])
