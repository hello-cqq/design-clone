import ctypes, ctypes.util, sys, time

x, y = int(sys.argv[1]), int(sys.argv[2])


class CGPoint(ctypes.Structure):
    _fields_ = [("x", ctypes.c_double), ("y", ctypes.c_double)]


cg = ctypes.CDLL(ctypes.util.find_library("CoreGraphics"))
cg.CGEventCreateMouseEvent.restype = ctypes.c_void_p
cg.CGEventCreateMouseEvent.argtypes = [ctypes.c_void_p, ctypes.c_uint32, CGPoint, ctypes.c_uint32]
cg.CGEventPost.argtypes = [ctypes.c_uint32, ctypes.c_void_p]
cg.CFRelease.argtypes = [ctypes.c_void_p]

p = CGPoint(x, y)
# kCGEventMouseMoved=5, LeftMouseDown=1, LeftMouseUp=2, kCGHIDEventTap=0, kCGMouseButtonLeft=0
mv = cg.CGEventCreateMouseEvent(None, 5, p, 0)
cg.CGEventPost(0, mv)
cg.CFRelease(mv)
time.sleep(0.05)
dn = cg.CGEventCreateMouseEvent(None, 1, p, 0)
cg.CGEventPost(0, dn)
cg.CFRelease(dn)
time.sleep(0.08)
up = cg.CGEventCreateMouseEvent(None, 2, p, 0)
cg.CGEventPost(0, up)
cg.CFRelease(up)
print(f"clickcg ({x},{y})")
