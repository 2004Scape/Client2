(module
 (type $0 (func (param i32) (result i32)))
 (type $1 (func))
 (type $2 (func (param i32 i32) (result i32)))
 (type $3 (func (param i32 i32 i32) (result i32)))
 (type $4 (func (param i32)))
 (type $5 (func (param i32 i32)))
 (type $6 (func (param i32 i32 i32 i32)))
 (type $7 (func (param i32 i32 i64)))
 (type $8 (func (result i32)))
 (type $9 (func (param i32 i32 i32 i32 i32 i32 i32)))
 (type $10 (func (param i32 i32 i32 i32) (result i32)))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $~lib/rt/tlsf/ROOT (mut i32) (i32.const 0))
 (global $~lib/rt/tcms/fromSpace (mut i32) (i32.const 0))
 (global $~lib/rt/tcms/white (mut i32) (i32.const 0))
 (global $~lib/rt/tcms/total (mut i32) (i32.const 0))
 (global $assembly/bz2/BZip2State.tt (mut i32) (i32.const 0))
 (global $assembly/bz2/state (mut i32) (i32.const 0))
 (global $~lib/rt/tcms/pinSpace (mut i32) (i32.const 0))
 (global $~lib/rt/tcms/toSpace (mut i32) (i32.const 0))
 (global $~lib/rt/__rtti_base i32 (i32.const 1792))
 (memory $0 1)
 (data $0 (i32.const 1036) ",")
 (data $0.1 (i32.const 1048) "\02\00\00\00\1c\00\00\00I\00n\00v\00a\00l\00i\00d\00 \00l\00e\00n\00g\00t\00h")
 (data $1 (i32.const 1084) "<")
 (data $1.1 (i32.const 1096) "\02\00\00\00&\00\00\00~\00l\00i\00b\00/\00s\00t\00a\00t\00i\00c\00a\00r\00r\00a\00y\00.\00t\00s")
 (data $2 (i32.const 1148) "<")
 (data $2.1 (i32.const 1160) "\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e")
 (data $3 (i32.const 1212) "<")
 (data $3.1 (i32.const 1224) "\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00t\00c\00m\00s\00.\00t\00s")
 (data $4 (i32.const 1276) "<")
 (data $4.1 (i32.const 1288) "\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00t\00l\00s\00f\00.\00t\00s")
 (data $6 (i32.const 1372) "\1c")
 (data $6.1 (i32.const 1384) "\0c\00\00\00\08\00\00\00\01")
 (data $7 (i32.const 1404) "\1c")
 (data $7.1 (i32.const 1416) "\0f\00\00\00\08\00\00\00\02")
 (data $8 (i32.const 1436) "\1c")
 (data $8.1 (i32.const 1448) "\0f\00\00\00\08\00\00\00\03")
 (data $9 (i32.const 1468) "\1c")
 (data $9.1 (i32.const 1480) "\0f\00\00\00\08\00\00\00\04")
 (data $10 (i32.const 1500) "\1c")
 (data $10.1 (i32.const 1512) "\04")
 (data $11 (i32.const 1532) "\1c")
 (data $11.1 (i32.const 1544) "\04")
 (data $12 (i32.const 1564) "\1c")
 (data $12.1 (i32.const 1576) "\04")
 (data $13 (i32.const 1596) "<")
 (data $13.1 (i32.const 1608) "\02\00\00\00*\00\00\00O\00b\00j\00e\00c\00t\00 \00a\00l\00r\00e\00a\00d\00y\00 \00p\00i\00n\00n\00e\00d")
 (data $15 (i32.const 1692) "<")
 (data $15.1 (i32.const 1704) "\02\00\00\00(\00\00\00O\00b\00j\00e\00c\00t\00 \00i\00s\00 \00n\00o\00t\00 \00p\00i\00n\00n\00e\00d")
 (data $17 (i32.const 1792) "\10\00\00\00 \00\00\00 \00\00\00 \00\00\00\00\00\00\00$\t\00\00\00\00\00\00d\08\00\00d\00\00\00d\00\00\00\02A\00\00\02A\00\00\04A\00\00\00\00\00\00\02\t\00\00\04A")
 (table $0 5 5 funcref)
 (elem $0 (i32.const 1) $assembly/bz2/BZip2State#constructor~anonymous|0 $assembly/bz2/BZip2State#constructor~anonymous|1 $assembly/bz2/BZip2State#constructor~anonymous|1 $assembly/bz2/BZip2State#constructor~anonymous|1)
 (export "read" (func $assembly/bz2/read))
 (export "__new" (func $~lib/rt/tcms/__new))
 (export "__pin" (func $~lib/rt/tcms/__pin))
 (export "__unpin" (func $~lib/rt/tcms/__unpin))
 (export "__collect" (func $~lib/rt/tcms/__collect))
 (export "__rtti_base" (global $~lib/rt/__rtti_base))
 (export "memory" (memory $0))
 (start $~start)
 (func $~lib/rt/tlsf/removeBlock (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  local.get $1
  i32.load
  i32.const -4
  i32.and
  local.tee $3
  i32.const 256
  i32.lt_u
  if (result i32)
   local.get $3
   i32.const 4
   i32.shr_u
  else
   i32.const 31
   i32.const 1073741820
   local.get $3
   local.get $3
   i32.const 1073741820
   i32.ge_u
   select
   local.tee $3
   i32.clz
   i32.sub
   local.tee $4
   i32.const 7
   i32.sub
   local.set $2
   local.get $3
   local.get $4
   i32.const 4
   i32.sub
   i32.shr_u
   i32.const 16
   i32.xor
  end
  local.set $4
  local.get $1
  i32.load offset=8
  local.set $5
  local.get $1
  i32.load offset=4
  local.tee $3
  if
   local.get $3
   local.get $5
   i32.store offset=8
  end
  local.get $5
  if
   local.get $5
   local.get $3
   i32.store offset=4
  end
  local.get $1
  local.get $0
  local.get $2
  i32.const 4
  i32.shl
  local.get $4
  i32.add
  i32.const 2
  i32.shl
  i32.add
  local.tee $1
  i32.load offset=96
  i32.eq
  if
   local.get $1
   local.get $5
   i32.store offset=96
   local.get $5
   i32.eqz
   if
    local.get $0
    local.get $2
    i32.const 2
    i32.shl
    i32.add
    local.tee $1
    i32.load offset=4
    i32.const -2
    local.get $4
    i32.rotl
    i32.and
    local.set $3
    local.get $1
    local.get $3
    i32.store offset=4
    local.get $3
    i32.eqz
    if
     local.get $0
     local.get $0
     i32.load
     i32.const -2
     local.get $2
     i32.rotl
     i32.and
     i32.store
    end
   end
  end
 )
 (func $~lib/rt/tlsf/insertBlock (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  local.get $1
  i32.const 4
  i32.add
  local.tee $6
  local.get $1
  i32.load
  local.tee $3
  i32.const -4
  i32.and
  i32.add
  local.tee $4
  i32.load
  local.tee $2
  i32.const 1
  i32.and
  if
   local.get $0
   local.get $4
   call $~lib/rt/tlsf/removeBlock
   local.get $1
   local.get $3
   i32.const 4
   i32.add
   local.get $2
   i32.const -4
   i32.and
   i32.add
   local.tee $3
   i32.store
   local.get $6
   local.get $1
   i32.load
   i32.const -4
   i32.and
   i32.add
   local.tee $4
   i32.load
   local.set $2
  end
  local.get $3
  i32.const 2
  i32.and
  if
   local.get $1
   i32.const 4
   i32.sub
   i32.load
   local.tee $1
   i32.load
   local.set $6
   local.get $0
   local.get $1
   call $~lib/rt/tlsf/removeBlock
   local.get $1
   local.get $6
   i32.const 4
   i32.add
   local.get $3
   i32.const -4
   i32.and
   i32.add
   local.tee $3
   i32.store
  end
  local.get $4
  local.get $2
  i32.const 2
  i32.or
  i32.store
  local.get $4
  i32.const 4
  i32.sub
  local.get $1
  i32.store
  local.get $0
  local.get $3
  i32.const -4
  i32.and
  local.tee $2
  i32.const 256
  i32.lt_u
  if (result i32)
   local.get $2
   i32.const 4
   i32.shr_u
  else
   i32.const 31
   i32.const 1073741820
   local.get $2
   local.get $2
   i32.const 1073741820
   i32.ge_u
   select
   local.tee $2
   i32.clz
   i32.sub
   local.tee $3
   i32.const 7
   i32.sub
   local.set $5
   local.get $2
   local.get $3
   i32.const 4
   i32.sub
   i32.shr_u
   i32.const 16
   i32.xor
  end
  local.tee $2
  local.get $5
  i32.const 4
  i32.shl
  i32.add
  i32.const 2
  i32.shl
  i32.add
  i32.load offset=96
  local.set $3
  local.get $1
  i32.const 0
  i32.store offset=4
  local.get $1
  local.get $3
  i32.store offset=8
  local.get $3
  if
   local.get $3
   local.get $1
   i32.store offset=4
  end
  local.get $0
  local.get $5
  i32.const 4
  i32.shl
  local.get $2
  i32.add
  i32.const 2
  i32.shl
  i32.add
  local.get $1
  i32.store offset=96
  local.get $0
  local.get $0
  i32.load
  i32.const 1
  local.get $5
  i32.shl
  i32.or
  i32.store
  local.get $0
  local.get $5
  i32.const 2
  i32.shl
  i32.add
  local.tee $0
  local.get $0
  i32.load offset=4
  i32.const 1
  local.get $2
  i32.shl
  i32.or
  i32.store offset=4
 )
 (func $~lib/rt/tlsf/addMemory (param $0 i32) (param $1 i32) (param $2 i64)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  local.get $1
  i32.const 19
  i32.add
  i32.const -16
  i32.and
  i32.const 4
  i32.sub
  local.set $1
  local.get $0
  i32.load offset=1568
  local.tee $3
  if
   local.get $1
   i32.const 16
   i32.sub
   local.tee $5
   local.get $3
   i32.eq
   if
    local.get $3
    i32.load
    local.set $4
    local.get $5
    local.set $1
   end
  end
  local.get $2
  i32.wrap_i64
  i32.const -16
  i32.and
  local.get $1
  i32.sub
  local.tee $3
  i32.const 20
  i32.lt_u
  if
   return
  end
  local.get $1
  local.get $4
  i32.const 2
  i32.and
  local.get $3
  i32.const 8
  i32.sub
  local.tee $3
  i32.const 1
  i32.or
  i32.or
  i32.store
  local.get $1
  i32.const 0
  i32.store offset=4
  local.get $1
  i32.const 0
  i32.store offset=8
  local.get $1
  i32.const 4
  i32.add
  local.get $3
  i32.add
  local.tee $3
  i32.const 2
  i32.store
  local.get $0
  local.get $3
  i32.store offset=1568
  local.get $0
  local.get $1
  call $~lib/rt/tlsf/insertBlock
 )
 (func $~lib/rt/tlsf/initialize
  (local $0 i32)
  (local $1 i32)
  memory.size
  local.tee $0
  i32.const 0
  i32.le_s
  if (result i32)
   i32.const 1
   local.get $0
   i32.sub
   memory.grow
   i32.const 0
   i32.lt_s
  else
   i32.const 0
  end
  if
   unreachable
  end
  i32.const 1872
  i32.const 0
  i32.store
  i32.const 3440
  i32.const 0
  i32.store
  loop $for-loop|0
   local.get $1
   i32.const 23
   i32.lt_u
   if
    local.get $1
    i32.const 2
    i32.shl
    i32.const 1872
    i32.add
    i32.const 0
    i32.store offset=4
    i32.const 0
    local.set $0
    loop $for-loop|1
     local.get $0
     i32.const 16
     i32.lt_u
     if
      local.get $1
      i32.const 4
      i32.shl
      local.get $0
      i32.add
      i32.const 2
      i32.shl
      i32.const 1872
      i32.add
      i32.const 0
      i32.store offset=96
      local.get $0
      i32.const 1
      i32.add
      local.set $0
      br $for-loop|1
     end
    end
    local.get $1
    i32.const 1
    i32.add
    local.set $1
    br $for-loop|0
   end
  end
  i32.const 1872
  i32.const 3444
  memory.size
  i64.extend_i32_s
  i64.const 16
  i64.shl
  call $~lib/rt/tlsf/addMemory
  i32.const 1872
  global.set $~lib/rt/tlsf/ROOT
 )
 (func $~lib/rt/tlsf/searchBlock (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  local.get $1
  i32.const 256
  i32.lt_u
  if
   local.get $1
   i32.const 4
   i32.shr_u
   local.set $1
  else
   local.get $1
   i32.const 536870910
   i32.lt_u
   if
    local.get $1
    i32.const 1
    i32.const 27
    local.get $1
    i32.clz
    i32.sub
    i32.shl
    i32.add
    i32.const 1
    i32.sub
    local.set $1
   end
   local.get $1
   i32.const 31
   local.get $1
   i32.clz
   i32.sub
   local.tee $2
   i32.const 4
   i32.sub
   i32.shr_u
   i32.const 16
   i32.xor
   local.set $1
   local.get $2
   i32.const 7
   i32.sub
   local.set $2
  end
  local.get $0
  local.get $2
  i32.const 2
  i32.shl
  i32.add
  i32.load offset=4
  i32.const -1
  local.get $1
  i32.shl
  i32.and
  local.tee $1
  if (result i32)
   local.get $0
   local.get $1
   i32.ctz
   local.get $2
   i32.const 4
   i32.shl
   i32.add
   i32.const 2
   i32.shl
   i32.add
   i32.load offset=96
  else
   local.get $0
   i32.load
   i32.const -1
   local.get $2
   i32.const 1
   i32.add
   i32.shl
   i32.and
   local.tee $1
   if (result i32)
    local.get $0
    local.get $0
    local.get $1
    i32.ctz
    local.tee $0
    i32.const 2
    i32.shl
    i32.add
    i32.load offset=4
    i32.ctz
    local.get $0
    i32.const 4
    i32.shl
    i32.add
    i32.const 2
    i32.shl
    i32.add
    i32.load offset=96
   else
    i32.const 0
   end
  end
 )
 (func $~lib/rt/tcms/__new (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  local.get $0
  i32.const 1073741804
  i32.gt_u
  if
   i32.const 1168
   i32.const 1232
   i32.const 125
   i32.const 30
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/rt/tlsf/ROOT
  i32.eqz
  if
   call $~lib/rt/tlsf/initialize
  end
  global.get $~lib/rt/tlsf/ROOT
  local.set $4
  local.get $0
  i32.const 16
  i32.add
  local.tee $2
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 1168
   i32.const 1296
   i32.const 461
   i32.const 29
   call $~lib/builtins/abort
   unreachable
  end
  local.get $4
  local.get $2
  i32.const 12
  i32.le_u
  if (result i32)
   i32.const 12
  else
   local.get $2
   i32.const 19
   i32.add
   i32.const -16
   i32.and
   i32.const 4
   i32.sub
  end
  local.tee $5
  call $~lib/rt/tlsf/searchBlock
  local.tee $2
  i32.eqz
  if
   memory.size
   local.tee $2
   local.get $5
   i32.const 256
   i32.ge_u
   if (result i32)
    local.get $5
    i32.const 536870910
    i32.lt_u
    if (result i32)
     local.get $5
     i32.const 1
     i32.const 27
     local.get $5
     i32.clz
     i32.sub
     i32.shl
     i32.add
     i32.const 1
     i32.sub
    else
     local.get $5
    end
   else
    local.get $5
   end
   i32.const 4
   local.get $4
   i32.load offset=1568
   local.get $2
   i32.const 16
   i32.shl
   i32.const 4
   i32.sub
   i32.ne
   i32.shl
   i32.add
   i32.const 65535
   i32.add
   i32.const -65536
   i32.and
   i32.const 16
   i32.shr_u
   local.tee $3
   local.get $2
   local.get $3
   i32.gt_s
   select
   memory.grow
   i32.const 0
   i32.lt_s
   if
    local.get $3
    memory.grow
    i32.const 0
    i32.lt_s
    if
     unreachable
    end
   end
   local.get $4
   local.get $2
   i32.const 16
   i32.shl
   memory.size
   i64.extend_i32_s
   i64.const 16
   i64.shl
   call $~lib/rt/tlsf/addMemory
   local.get $4
   local.get $5
   call $~lib/rt/tlsf/searchBlock
   local.set $2
  end
  local.get $2
  i32.load
  drop
  local.get $4
  local.get $2
  call $~lib/rt/tlsf/removeBlock
  local.get $2
  i32.load
  local.tee $3
  i32.const -4
  i32.and
  local.get $5
  i32.sub
  local.tee $6
  i32.const 16
  i32.ge_u
  if
   local.get $2
   local.get $5
   local.get $3
   i32.const 2
   i32.and
   i32.or
   i32.store
   local.get $2
   i32.const 4
   i32.add
   local.get $5
   i32.add
   local.tee $3
   local.get $6
   i32.const 4
   i32.sub
   i32.const 1
   i32.or
   i32.store
   local.get $4
   local.get $3
   call $~lib/rt/tlsf/insertBlock
  else
   local.get $2
   local.get $3
   i32.const -2
   i32.and
   i32.store
   local.get $2
   i32.const 4
   i32.add
   local.get $2
   i32.load
   i32.const -4
   i32.and
   i32.add
   local.tee $3
   local.get $3
   i32.load
   i32.const -3
   i32.and
   i32.store
  end
  local.get $2
  local.get $1
  i32.store offset=12
  local.get $2
  local.get $0
  i32.store offset=16
  global.get $~lib/rt/tcms/fromSpace
  local.tee $0
  i32.load offset=8
  local.set $1
  local.get $2
  local.get $0
  global.get $~lib/rt/tcms/white
  i32.or
  i32.store offset=4
  local.get $2
  local.get $1
  i32.store offset=8
  local.get $1
  local.get $2
  local.get $1
  i32.load offset=4
  i32.const 3
  i32.and
  i32.or
  i32.store offset=4
  local.get $0
  local.get $2
  i32.store offset=8
  global.get $~lib/rt/tcms/total
  local.get $2
  i32.load
  i32.const -4
  i32.and
  i32.const 4
  i32.add
  i32.add
  global.set $~lib/rt/tcms/total
  local.get $2
  i32.const 20
  i32.add
 )
 (func $~lib/staticarray/StaticArray<i32>#constructor (param $0 i32) (result i32)
  (local $1 i32)
  local.get $0
  i32.const 268435455
  i32.gt_u
  if
   i32.const 1056
   i32.const 1104
   i32.const 51
   i32.const 60
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 2
  i32.shl
  local.tee $0
  i32.const 4
  call $~lib/rt/tcms/__new
  local.tee $1
  i32.const 0
  local.get $0
  memory.fill
  local.get $1
 )
 (func $~lib/staticarray/StaticArray<i8>#constructor (param $0 i32) (result i32)
  (local $1 i32)
  local.get $0
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 1056
   i32.const 1104
   i32.const 51
   i32.const 60
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 6
  call $~lib/rt/tcms/__new
  local.tee $1
  i32.const 0
  local.get $0
  memory.fill
  local.get $1
 )
 (func $~lib/staticarray/StaticArray<bool>#constructor (param $0 i32) (result i32)
  (local $1 i32)
  local.get $0
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 1056
   i32.const 1104
   i32.const 51
   i32.const 60
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 7
  call $~lib/rt/tcms/__new
  local.tee $1
  i32.const 0
  local.get $0
  memory.fill
  local.get $1
 )
 (func $~lib/staticarray/StaticArray<u8>#constructor (param $0 i32) (result i32)
  (local $1 i32)
  local.get $0
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 1056
   i32.const 1104
   i32.const 51
   i32.const 60
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 8
  call $~lib/rt/tcms/__new
  local.tee $1
  i32.const 0
  local.get $0
  memory.fill
  local.get $1
 )
 (func $assembly/bz2/BZip2State#constructor~anonymous|0 (param $0 i32) (param $1 i32) (param $2 i32) (result i32)
  i32.const 258
  call $~lib/staticarray/StaticArray<u8>#constructor
 )
 (func $~lib/rt/__newArray (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  local.get $0
  i32.const 2
  i32.shl
  local.tee $3
  i32.const 1
  call $~lib/rt/tcms/__new
  local.set $2
  i32.const 16
  local.get $1
  call $~lib/rt/tcms/__new
  local.tee $1
  local.get $2
  i32.store
  local.get $1
  local.get $2
  i32.store offset=4
  local.get $1
  local.get $3
  i32.store offset=8
  local.get $1
  local.get $0
  i32.store offset=12
  local.get $1
 )
 (func $assembly/bz2/BZip2State#constructor~anonymous|1 (param $0 i32) (param $1 i32) (param $2 i32) (result i32)
  i32.const 258
  call $~lib/staticarray/StaticArray<i32>#constructor
 )
 (func $~lib/staticarray/StaticArray<~lib/staticarray/StaticArray<i32>>#map<~lib/staticarray/StaticArray<i32>> (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  local.get $0
  i32.const 20
  i32.sub
  i32.load offset=16
  i32.const 2
  i32.shr_u
  local.tee $3
  i32.const 10
  call $~lib/rt/__newArray
  local.tee $4
  i32.load offset=4
  local.set $5
  loop $for-loop|0
   local.get $2
   local.get $3
   i32.lt_s
   if
    local.get $5
    local.get $2
    i32.const 2
    i32.shl
    local.tee $6
    i32.add
    local.get $0
    local.get $6
    i32.add
    i32.load
    local.get $2
    local.get $0
    local.get $1
    i32.load
    call_indirect (type $3)
    i32.store
    local.get $2
    i32.const 1
    i32.add
    local.set $2
    br $for-loop|0
   end
  end
  local.get $4
 )
 (func $assembly/bz2/BZip2State#constructor (result i32)
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  i32.const 148
  i32.const 5
  call $~lib/rt/tcms/__new
  local.tee $0
  i32.eqz
  if
   i32.const 0
   i32.const 0
   call $~lib/rt/tcms/__new
   local.set $0
  end
  local.get $0
  i32.const 0
  call $~lib/staticarray/StaticArray<i8>#constructor
  i32.store
  local.get $0
  i32.const 0
  call $~lib/staticarray/StaticArray<i8>#constructor
  i32.store offset=4
  local.get $0
  i32.const 0
  i32.store offset=8
  local.get $0
  i32.const 0
  i32.store offset=12
  local.get $0
  i32.const 0
  i32.store offset=16
  local.get $0
  i32.const 0
  i32.store offset=20
  local.get $0
  i32.const 0
  i32.store offset=24
  local.get $0
  i32.const 0
  i32.store offset=28
  local.get $0
  i32.const 0
  i32.store offset=32
  local.get $0
  i32.const 0
  i32.store offset=36
  local.get $0
  i32.const 0
  i32.store8 offset=40
  local.get $0
  i32.const 0
  i32.store offset=44
  local.get $0
  i32.const 0
  i32.store8 offset=48
  local.get $0
  i32.const 0
  i32.store offset=52
  local.get $0
  i32.const 0
  i32.store offset=56
  local.get $0
  i32.const 0
  i32.store offset=60
  local.get $0
  i32.const 0
  i32.store offset=64
  local.get $0
  i32.const 0
  i32.store offset=68
  local.get $0
  i32.const 0
  i32.store offset=72
  local.get $0
  i32.const 0
  i32.store offset=76
  local.get $0
  i32.const 0
  i32.store offset=80
  local.get $0
  i32.const 0
  i32.store offset=84
  local.get $0
  i32.const 256
  call $~lib/staticarray/StaticArray<i32>#constructor
  i32.store offset=88
  local.get $0
  i32.const 257
  call $~lib/staticarray/StaticArray<i32>#constructor
  i32.store offset=92
  local.get $0
  i32.const 257
  call $~lib/staticarray/StaticArray<i32>#constructor
  i32.store offset=96
  local.get $0
  i32.const 256
  call $~lib/staticarray/StaticArray<bool>#constructor
  i32.store offset=100
  local.get $0
  i32.const 16
  call $~lib/staticarray/StaticArray<bool>#constructor
  i32.store offset=104
  local.get $0
  i32.const 256
  call $~lib/staticarray/StaticArray<u8>#constructor
  i32.store offset=108
  local.get $0
  i32.const 4096
  call $~lib/staticarray/StaticArray<u8>#constructor
  i32.store offset=112
  local.get $0
  i32.const 32
  call $~lib/staticarray/StaticArray<i32>#constructor
  i32.store offset=116
  local.get $0
  i32.const 18002
  call $~lib/staticarray/StaticArray<u8>#constructor
  i32.store offset=120
  local.get $0
  i32.const 18002
  call $~lib/staticarray/StaticArray<u8>#constructor
  i32.store offset=124
  i32.const 24
  i32.const 11
  call $~lib/rt/tcms/__new
  local.tee $6
  i32.const 0
  i32.const 24
  memory.fill
  local.get $6
  i32.const 20
  i32.sub
  i32.load offset=16
  i32.const 2
  i32.shr_u
  local.tee $2
  i32.const 9
  call $~lib/rt/__newArray
  local.tee $3
  i32.load offset=4
  local.set $4
  loop $for-loop|0
   local.get $1
   local.get $2
   i32.lt_s
   if
    local.get $4
    local.get $1
    i32.const 2
    i32.shl
    local.tee $5
    i32.add
    local.get $5
    local.get $6
    i32.add
    i32.load
    local.get $1
    local.get $6
    i32.const 1392
    i32.load
    call_indirect (type $3)
    i32.store
    local.get $1
    i32.const 1
    i32.add
    local.set $1
    br $for-loop|0
   end
  end
  local.get $0
  local.get $3
  i32.store offset=128
  i32.const 24
  i32.const 14
  call $~lib/rt/tcms/__new
  local.tee $1
  i32.const 0
  i32.const 24
  memory.fill
  local.get $0
  local.get $1
  i32.const 1424
  call $~lib/staticarray/StaticArray<~lib/staticarray/StaticArray<i32>>#map<~lib/staticarray/StaticArray<i32>>
  i32.store offset=132
  i32.const 24
  i32.const 14
  call $~lib/rt/tcms/__new
  local.tee $1
  i32.const 0
  i32.const 24
  memory.fill
  local.get $0
  local.get $1
  i32.const 1456
  call $~lib/staticarray/StaticArray<~lib/staticarray/StaticArray<i32>>#map<~lib/staticarray/StaticArray<i32>>
  i32.store offset=136
  i32.const 24
  i32.const 14
  call $~lib/rt/tcms/__new
  local.tee $1
  i32.const 0
  i32.const 24
  memory.fill
  local.get $0
  local.get $1
  i32.const 1488
  call $~lib/staticarray/StaticArray<~lib/staticarray/StaticArray<i32>>#map<~lib/staticarray/StaticArray<i32>>
  i32.store offset=140
  local.get $0
  i32.const 6
  call $~lib/staticarray/StaticArray<i32>#constructor
  i32.store offset=144
  local.get $0
 )
 (func $assembly/bz2/getBits (param $0 i32) (result i32)
  (local $1 i32)
  loop $while-continue|0
   global.get $assembly/bz2/state
   i32.load offset=56
   local.get $0
   i32.lt_s
   if
    global.get $assembly/bz2/state
    global.get $assembly/bz2/state
    i32.load
    global.get $assembly/bz2/state
    i32.load offset=8
    i32.add
    i32.load8_u
    global.get $assembly/bz2/state
    i32.load offset=52
    i32.const 8
    i32.shl
    i32.or
    i32.store offset=52
    global.get $assembly/bz2/state
    global.get $assembly/bz2/state
    i32.load offset=56
    i32.const 8
    i32.add
    i32.store offset=56
    global.get $assembly/bz2/state
    global.get $assembly/bz2/state
    i32.load offset=8
    i32.const 1
    i32.add
    i32.store offset=8
    global.get $assembly/bz2/state
    global.get $assembly/bz2/state
    i32.load offset=12
    i32.const 1
    i32.sub
    i32.store offset=12
    global.get $assembly/bz2/state
    global.get $assembly/bz2/state
    i32.load offset=16
    i32.const 1
    i32.add
    i32.store offset=16
    global.get $assembly/bz2/state
    i32.load offset=16
    i32.eqz
    if
     global.get $assembly/bz2/state
     global.get $assembly/bz2/state
     i32.load offset=20
     i32.const 1
     i32.add
     i32.store offset=20
    end
    br $while-continue|0
   end
  end
  i32.const 1
  local.get $0
  i32.shl
  i32.const 1
  i32.sub
  global.get $assembly/bz2/state
  i32.load offset=52
  global.get $assembly/bz2/state
  i32.load offset=56
  local.get $0
  i32.sub
  local.tee $1
  i32.shr_s
  i32.and
  local.set $0
  global.get $assembly/bz2/state
  local.get $1
  i32.store offset=56
  local.get $0
 )
 (func $assembly/bz2/createDecodeTables (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (param $5 i32) (param $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  local.get $4
  local.set $8
  loop $for-loop|0
   local.get $5
   local.get $8
   i32.ge_s
   if
    i32.const 0
    local.set $9
    loop $for-loop|1
     local.get $6
     local.get $9
     i32.gt_s
     if
      local.get $3
      local.get $9
      i32.add
      i32.load8_u
      local.get $8
      i32.eq
      if
       local.get $2
       local.get $7
       i32.const 2
       i32.shl
       i32.add
       local.get $9
       i32.store
       local.get $7
       i32.const 1
       i32.add
       local.set $7
      end
      local.get $9
      i32.const 1
      i32.add
      local.set $9
      br $for-loop|1
     end
    end
    local.get $8
    i32.const 1
    i32.add
    local.set $8
    br $for-loop|0
   end
  end
  loop $for-loop|2
   local.get $10
   i32.const 23
   i32.lt_s
   if
    local.get $1
    local.get $10
    i32.const 2
    i32.shl
    i32.add
    i32.const 0
    i32.store
    local.get $10
    i32.const 1
    i32.add
    local.set $10
    br $for-loop|2
   end
  end
  loop $for-loop|3
   local.get $6
   local.get $11
   i32.gt_s
   if
    local.get $1
    local.get $3
    local.get $11
    i32.add
    i32.load8_u
    i32.const 1
    i32.add
    i32.const 255
    i32.and
    i32.const 2
    i32.shl
    i32.add
    local.tee $2
    local.get $2
    i32.load
    i32.const 1
    i32.add
    i32.store
    local.get $11
    i32.const 1
    i32.add
    local.set $11
    br $for-loop|3
   end
  end
  i32.const 1
  local.set $2
  loop $for-loop|4
   local.get $2
   i32.const 23
   i32.lt_s
   if
    local.get $1
    local.get $2
    i32.const 2
    i32.shl
    i32.add
    local.tee $3
    local.get $3
    i32.load
    local.get $1
    local.get $2
    i32.const 1
    i32.sub
    i32.const 2
    i32.shl
    i32.add
    i32.load
    i32.add
    i32.store
    local.get $2
    i32.const 1
    i32.add
    local.set $2
    br $for-loop|4
   end
  end
  loop $for-loop|5
   local.get $12
   i32.const 23
   i32.lt_s
   if
    local.get $0
    local.get $12
    i32.const 2
    i32.shl
    i32.add
    i32.const 0
    i32.store
    local.get $12
    i32.const 1
    i32.add
    local.set $12
    br $for-loop|5
   end
  end
  local.get $4
  local.set $2
  loop $for-loop|6
   local.get $2
   local.get $5
   i32.le_s
   if
    local.get $13
    local.get $1
    local.get $2
    i32.const 1
    i32.add
    local.tee $3
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.get $2
    i32.const 2
    i32.shl
    local.tee $2
    local.get $1
    i32.add
    i32.load
    i32.sub
    i32.add
    local.set $6
    local.get $0
    local.get $2
    i32.add
    local.get $6
    i32.const 1
    i32.sub
    i32.store
    local.get $6
    i32.const 1
    i32.shl
    local.set $13
    local.get $3
    local.set $2
    br $for-loop|6
   end
  end
  local.get $4
  i32.const 1
  i32.add
  local.set $2
  loop $for-loop|7
   local.get $2
   local.get $5
   i32.le_s
   if
    local.get $1
    local.get $2
    i32.const 2
    i32.shl
    i32.add
    local.tee $3
    local.get $0
    local.get $2
    i32.const 1
    i32.sub
    i32.const 2
    i32.shl
    i32.add
    i32.load
    i32.const 1
    i32.add
    i32.const 1
    i32.shl
    local.get $3
    i32.load
    i32.sub
    i32.store
    local.get $2
    i32.const 1
    i32.add
    local.set $2
    br $for-loop|7
   end
  end
 )
 (func $assembly/bz2/finish
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  global.get $assembly/bz2/state
  i32.load8_u offset=40
  local.set $1
  global.get $assembly/bz2/state
  i32.load offset=44
  local.set $4
  global.get $assembly/bz2/state
  i32.load offset=76
  local.set $5
  global.get $assembly/bz2/state
  i32.load offset=72
  local.set $0
  global.get $assembly/bz2/BZip2State.tt
  local.set $9
  global.get $assembly/bz2/state
  i32.load offset=68
  local.set $3
  global.get $assembly/bz2/state
  i32.load offset=4
  local.set $12
  global.get $assembly/bz2/state
  i32.load offset=24
  local.set $7
  global.get $assembly/bz2/state
  i32.load offset=28
  local.tee $6
  local.set $13
  global.get $assembly/bz2/state
  i32.load offset=84
  i32.const 1
  i32.add
  local.set $10
  i32.const 1
  local.set $8
  loop $do-loop|0
   local.get $4
   i32.const 0
   i32.gt_s
   if
    i32.const 1
    local.set $2
    loop $do-loop|1
     local.get $6
     if
      local.get $7
      local.get $12
      i32.add
      local.get $1
      i32.store8
      local.get $4
      i32.const 1
      i32.eq
      if
       i32.const 0
       local.set $2
      else
       local.get $4
       i32.const 1
       i32.sub
       local.set $4
      end
      local.get $7
      i32.const 1
      i32.add
      local.set $7
      local.get $6
      i32.const 1
      i32.sub
      local.set $6
     else
      i32.const 0
      local.set $8
      i32.const 0
      local.set $2
     end
     local.get $2
     br_if $do-loop|1
    end
   end
   i32.const 1
   local.set $11
   loop $while-continue|2
    local.get $11
    if
     i32.const 0
     local.set $11
     local.get $5
     local.get $10
     i32.eq
     if
      i32.const 0
      local.set $4
      i32.const 0
      local.set $8
     else
      local.get $0
      local.set $1
      local.get $9
      local.get $3
      i32.const 2
      i32.shl
      i32.add
      i32.load
      local.tee $3
      i32.const 255
      i32.and
      local.set $2
      local.get $3
      i32.const 8
      i32.shr_s
      local.set $3
      local.get $5
      i32.const 1
      i32.add
      local.set $5
      local.get $0
      local.get $2
      i32.ne
      if
       local.get $2
       local.set $0
       local.get $6
       if
        local.get $7
        local.get $12
        i32.add
        local.get $1
        i32.store8
        local.get $7
        i32.const 1
        i32.add
        local.set $7
        local.get $6
        i32.const 1
        i32.sub
        local.set $6
        i32.const 1
        local.set $11
       else
        i32.const 1
        local.set $4
        i32.const 0
        local.set $8
       end
      else
       local.get $5
       local.get $10
       i32.eq
       if
        local.get $6
        if
         local.get $7
         local.get $12
         i32.add
         local.get $1
         i32.store8
         local.get $7
         i32.const 1
         i32.add
         local.set $7
         local.get $6
         i32.const 1
         i32.sub
         local.set $6
         i32.const 1
         local.set $11
        else
         i32.const 1
         local.set $4
         i32.const 0
         local.set $8
        end
       end
      end
     end
     br $while-continue|2
    end
   end
   local.get $8
   if
    i32.const 2
    local.set $4
    local.get $9
    local.get $3
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.tee $3
    i32.const 255
    i32.and
    local.set $2
    local.get $3
    i32.const 8
    i32.shr_s
    local.set $3
    local.get $10
    local.get $5
    i32.const 1
    i32.add
    local.tee $5
    i32.ne
    if
     local.get $0
     local.get $2
     i32.eq
     if
      i32.const 3
      local.set $4
      local.get $9
      local.get $3
      i32.const 2
      i32.shl
      i32.add
      i32.load
      local.tee $3
      i32.const 255
      i32.and
      local.set $2
      local.get $3
      i32.const 8
      i32.shr_s
      local.set $3
      local.get $10
      local.get $5
      i32.const 1
      i32.add
      local.tee $5
      i32.ne
      if
       local.get $0
       local.get $2
       i32.eq
       if
        local.get $9
        local.get $3
        i32.const 2
        i32.shl
        i32.add
        i32.load
        local.tee $0
        i32.const 255
        i32.and
        i32.const 4
        i32.add
        i32.const 255
        i32.and
        local.set $4
        local.get $9
        local.get $0
        i32.const 8
        i32.shr_s
        i32.const 2
        i32.shl
        i32.add
        i32.load
        local.tee $2
        i32.const 255
        i32.and
        local.set $0
        local.get $2
        i32.const 8
        i32.shr_s
        local.set $3
        local.get $5
        i32.const 2
        i32.add
        local.set $5
       else
        local.get $2
        local.set $0
       end
      end
     else
      local.get $2
      local.set $0
     end
    end
   end
   local.get $8
   br_if $do-loop|0
  end
  global.get $assembly/bz2/state
  global.get $assembly/bz2/state
  i32.load offset=32
  local.tee $2
  local.get $13
  local.get $6
  i32.sub
  i32.add
  i32.store offset=32
  global.get $assembly/bz2/state
  i32.load offset=32
  local.get $2
  i32.lt_s
  if
   global.get $assembly/bz2/state
   global.get $assembly/bz2/state
   i32.load offset=36
   i32.const 1
   i32.add
   i32.store offset=36
  end
  global.get $assembly/bz2/state
  local.get $1
  i32.store8 offset=40
  global.get $assembly/bz2/state
  local.get $4
  i32.store offset=44
  global.get $assembly/bz2/state
  local.get $5
  i32.store offset=76
  global.get $assembly/bz2/state
  local.get $0
  i32.store offset=72
  global.get $assembly/bz2/state
  local.get $3
  i32.store offset=68
  global.get $assembly/bz2/state
  local.get $7
  i32.store offset=24
  global.get $assembly/bz2/state
  local.get $6
  i32.store offset=28
 )
 (func $assembly/bz2/decompress
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  i32.const 0
  i32.const 4
  call $~lib/rt/tcms/__new
  i32.const 1520
  i32.const 0
  memory.copy
  i32.const 0
  i32.const 4
  call $~lib/rt/tcms/__new
  i32.const 1552
  i32.const 0
  memory.copy
  i32.const 0
  i32.const 4
  call $~lib/rt/tcms/__new
  i32.const 1584
  i32.const 0
  memory.copy
  i32.const 1
  local.set $2
  loop $while-continue|0
   local.get $2
   if
    i32.const 8
    call $assembly/bz2/getBits
    i32.const 255
    i32.and
    i32.const 23
    i32.eq
    if
     return
    end
    i32.const 8
    call $assembly/bz2/getBits
    drop
    i32.const 8
    call $assembly/bz2/getBits
    drop
    i32.const 8
    call $assembly/bz2/getBits
    drop
    i32.const 8
    call $assembly/bz2/getBits
    drop
    i32.const 8
    call $assembly/bz2/getBits
    drop
    global.get $assembly/bz2/state
    global.get $assembly/bz2/state
    i32.load offset=60
    i32.const 1
    i32.add
    i32.store offset=60
    i32.const 8
    call $assembly/bz2/getBits
    drop
    i32.const 8
    call $assembly/bz2/getBits
    drop
    i32.const 8
    call $assembly/bz2/getBits
    drop
    i32.const 8
    call $assembly/bz2/getBits
    drop
    i32.const 1
    call $assembly/bz2/getBits
    local.set $0
    global.get $assembly/bz2/state
    local.get $0
    i32.const 255
    i32.and
    i32.const 0
    i32.ne
    i32.store8 offset=48
    global.get $assembly/bz2/state
    i32.load8_u offset=48
    drop
    global.get $assembly/bz2/state
    i32.const 0
    i32.store offset=64
    i32.const 8
    call $assembly/bz2/getBits
    local.set $0
    global.get $assembly/bz2/state
    local.get $0
    i32.const 255
    i32.and
    global.get $assembly/bz2/state
    i32.load offset=64
    i32.const 8
    i32.shl
    i32.or
    i32.store offset=64
    i32.const 8
    call $assembly/bz2/getBits
    local.set $0
    global.get $assembly/bz2/state
    local.get $0
    i32.const 255
    i32.and
    global.get $assembly/bz2/state
    i32.load offset=64
    i32.const 8
    i32.shl
    i32.or
    i32.store offset=64
    i32.const 8
    call $assembly/bz2/getBits
    local.set $0
    global.get $assembly/bz2/state
    local.get $0
    i32.const 255
    i32.and
    global.get $assembly/bz2/state
    i32.load offset=64
    i32.const 8
    i32.shl
    i32.or
    i32.store offset=64
    i32.const 0
    local.set $1
    loop $for-loop|1
     local.get $1
     i32.const 16
     i32.lt_s
     if
      i32.const 1
      call $assembly/bz2/getBits
      local.set $0
      global.get $assembly/bz2/state
      i32.load offset=104
      local.get $1
      i32.add
      local.get $0
      i32.const 255
      i32.and
      i32.const 1
      i32.eq
      i32.store8
      local.get $1
      i32.const 1
      i32.add
      local.set $1
      br $for-loop|1
     end
    end
    i32.const 0
    local.set $2
    loop $for-loop|2
     local.get $2
     i32.const 256
     i32.lt_s
     if
      global.get $assembly/bz2/state
      i32.load offset=100
      local.get $2
      i32.add
      i32.const 0
      i32.store8
      local.get $2
      i32.const 1
      i32.add
      local.set $2
      br $for-loop|2
     end
    end
    i32.const 0
    local.set $1
    loop $for-loop|3
     local.get $1
     i32.const 16
     i32.lt_s
     if
      global.get $assembly/bz2/state
      i32.load offset=104
      local.get $1
      i32.add
      i32.load8_u
      if
       i32.const 0
       local.set $2
       loop $for-loop|4
        local.get $2
        i32.const 16
        i32.lt_s
        if
         i32.const 1
         call $assembly/bz2/getBits
         i32.const 255
         i32.and
         i32.const 1
         i32.eq
         if
          global.get $assembly/bz2/state
          i32.load offset=100
          local.get $2
          local.get $1
          i32.const 4
          i32.shl
          i32.add
          i32.add
          i32.const 1
          i32.store8
         end
         local.get $2
         i32.const 1
         i32.add
         local.set $2
         br $for-loop|4
        end
       end
      end
      local.get $1
      i32.const 1
      i32.add
      local.set $1
      br $for-loop|3
     end
    end
    i32.const 0
    local.set $2
    global.get $assembly/bz2/state
    i32.const 0
    i32.store offset=80
    loop $for-loop|0
     local.get $2
     i32.const 256
     i32.lt_s
     if
      global.get $assembly/bz2/state
      i32.load offset=100
      local.get $2
      i32.add
      i32.load8_u
      if
       global.get $assembly/bz2/state
       i32.load offset=108
       global.get $assembly/bz2/state
       i32.load offset=80
       i32.add
       local.get $2
       i32.store8
       global.get $assembly/bz2/state
       global.get $assembly/bz2/state
       i32.load offset=80
       i32.const 1
       i32.add
       i32.store offset=80
      end
      local.get $2
      i32.const 1
      i32.add
      local.set $2
      br $for-loop|0
     end
    end
    global.get $assembly/bz2/state
    i32.load offset=80
    i32.const 2
    i32.add
    local.set $7
    i32.const 3
    call $assembly/bz2/getBits
    local.set $6
    i32.const 15
    call $assembly/bz2/getBits
    local.set $5
    i32.const 0
    local.set $1
    loop $for-loop|5
     local.get $1
     local.get $5
     i32.lt_s
     if
      i32.const 0
      local.set $2
      loop $while-continue|6
       i32.const 1
       call $assembly/bz2/getBits
       i32.const 255
       i32.and
       if
        local.get $2
        i32.const 1
        i32.add
        local.set $2
        br $while-continue|6
       end
      end
      global.get $assembly/bz2/state
      i32.load offset=124
      local.get $1
      i32.add
      local.get $2
      i32.store8
      local.get $1
      i32.const 1
      i32.add
      local.set $1
      br $for-loop|5
     end
    end
    i32.const 6
    call $~lib/staticarray/StaticArray<u8>#constructor
    local.set $4
    i32.const 0
    local.set $2
    loop $for-loop|7
     local.get $2
     local.get $6
     i32.lt_s
     if
      local.get $2
      local.get $4
      i32.add
      local.get $2
      i32.store8
      local.get $2
      i32.const 1
      i32.add
      local.set $2
      br $for-loop|7
     end
    end
    i32.const 0
    local.set $0
    loop $for-loop|8
     local.get $0
     local.get $5
     i32.lt_s
     if
      local.get $4
      global.get $assembly/bz2/state
      i32.load offset=124
      local.get $0
      i32.add
      i32.load8_u
      local.tee $2
      i32.add
      i32.load8_u
      local.set $3
      loop $while-continue|10
       local.get $2
       i32.const 255
       i32.and
       local.tee $1
       if
        local.get $1
        local.get $4
        i32.add
        local.get $4
        local.get $2
        i32.const 1
        i32.sub
        local.tee $2
        i32.const 255
        i32.and
        i32.add
        i32.load8_u
        i32.store8
        br $while-continue|10
       end
      end
      local.get $4
      local.get $3
      i32.store8
      global.get $assembly/bz2/state
      i32.load offset=120
      local.get $0
      i32.add
      local.get $3
      i32.store8
      local.get $0
      i32.const 1
      i32.add
      local.set $0
      br $for-loop|8
     end
    end
    i32.const 0
    local.set $3
    loop $for-loop|11
     local.get $3
     local.get $6
     i32.lt_s
     if
      i32.const 5
      call $assembly/bz2/getBits
      local.set $1
      i32.const 0
      local.set $2
      loop $for-loop|12
       local.get $2
       local.get $7
       i32.lt_s
       if
        loop $while-continue|13
         i32.const 1
         call $assembly/bz2/getBits
         i32.const 255
         i32.and
         if
          local.get $1
          i32.const 1
          i32.sub
          local.get $1
          i32.const 1
          i32.add
          i32.const 1
          call $assembly/bz2/getBits
          i32.const 255
          i32.and
          select
          local.set $1
          br $while-continue|13
         end
        end
        global.get $assembly/bz2/state
        i32.load offset=128
        i32.load offset=4
        local.get $3
        i32.const 2
        i32.shl
        i32.add
        i32.load
        local.get $2
        i32.add
        local.get $1
        i32.store8
        local.get $2
        i32.const 1
        i32.add
        local.set $2
        br $for-loop|12
       end
      end
      local.get $3
      i32.const 1
      i32.add
      local.set $3
      br $for-loop|11
     end
    end
    i32.const 0
    local.set $0
    loop $for-loop|14
     local.get $0
     local.get $6
     i32.lt_s
     if
      i32.const 32
      local.set $3
      i32.const 0
      local.set $1
      i32.const 0
      local.set $4
      loop $for-loop|15
       local.get $4
       local.get $7
       i32.lt_s
       if
        global.get $assembly/bz2/state
        i32.load offset=128
        i32.load offset=4
        local.get $0
        i32.const 2
        i32.shl
        i32.add
        i32.load
        local.get $4
        i32.add
        i32.load8_u
        local.tee $2
        local.get $1
        i32.gt_u
        if
         local.get $2
         local.set $1
        end
        global.get $assembly/bz2/state
        i32.load offset=128
        i32.load offset=4
        local.get $0
        i32.const 2
        i32.shl
        i32.add
        i32.load
        local.get $4
        i32.add
        i32.load8_u
        local.tee $2
        local.get $3
        i32.lt_u
        if
         local.get $2
         local.set $3
        end
        local.get $4
        i32.const 1
        i32.add
        local.set $4
        br $for-loop|15
       end
      end
      local.get $0
      i32.const 2
      i32.shl
      local.tee $2
      global.get $assembly/bz2/state
      i32.load offset=132
      i32.load offset=4
      i32.add
      i32.load
      local.get $2
      global.get $assembly/bz2/state
      i32.load offset=136
      i32.load offset=4
      i32.add
      i32.load
      local.get $2
      global.get $assembly/bz2/state
      i32.load offset=140
      i32.load offset=4
      i32.add
      i32.load
      local.get $2
      global.get $assembly/bz2/state
      i32.load offset=128
      i32.load offset=4
      i32.add
      i32.load
      local.get $3
      local.get $1
      local.get $7
      call $assembly/bz2/createDecodeTables
      local.get $2
      global.get $assembly/bz2/state
      i32.load offset=144
      i32.add
      local.get $3
      i32.store
      local.get $0
      i32.const 1
      i32.add
      local.set $0
      br $for-loop|14
     end
    end
    global.get $assembly/bz2/state
    i32.load offset=80
    i32.const 1
    i32.add
    local.set $6
    i32.const 0
    local.set $2
    loop $for-loop|16
     local.get $2
     i32.const 255
     i32.le_s
     if
      global.get $assembly/bz2/state
      i32.load offset=88
      local.get $2
      i32.const 2
      i32.shl
      i32.add
      i32.const 0
      i32.store
      local.get $2
      i32.const 1
      i32.add
      local.set $2
      br $for-loop|16
     end
    end
    i32.const 4095
    local.set $12
    i32.const 15
    local.set $1
    loop $for-loop|17
     local.get $1
     i32.const 0
     i32.ge_s
     if
      i32.const 15
      local.set $2
      loop $for-loop|18
       local.get $2
       i32.const 0
       i32.ge_s
       if
        global.get $assembly/bz2/state
        i32.load offset=112
        local.get $12
        i32.add
        local.get $1
        i32.const 4
        i32.shl
        local.get $2
        i32.add
        i32.store8
        local.get $12
        i32.const 1
        i32.sub
        local.set $12
        local.get $2
        i32.const 1
        i32.sub
        local.set $2
        br $for-loop|18
       end
      end
      global.get $assembly/bz2/state
      i32.load offset=116
      local.get $1
      i32.const 2
      i32.shl
      i32.add
      local.get $12
      i32.const 1
      i32.add
      i32.store
      local.get $1
      i32.const 1
      i32.sub
      local.set $1
      br $for-loop|17
     end
    end
    i32.const 0
    local.set $11
    i32.const 0
    local.set $7
    global.get $assembly/bz2/state
    i32.load offset=120
    i32.load8_u
    i32.const 2
    i32.shl
    local.tee $1
    global.get $assembly/bz2/state
    i32.load offset=144
    i32.add
    i32.load
    local.set $2
    local.get $1
    global.get $assembly/bz2/state
    i32.load offset=132
    i32.load offset=4
    i32.add
    i32.load
    local.set $9
    local.get $1
    global.get $assembly/bz2/state
    i32.load offset=140
    i32.load offset=4
    i32.add
    i32.load
    local.set $0
    local.get $1
    global.get $assembly/bz2/state
    i32.load offset=136
    i32.load offset=4
    i32.add
    i32.load
    local.set $8
    i32.const 49
    local.set $10
    local.get $2
    local.tee $1
    call $assembly/bz2/getBits
    local.set $13
    loop $for-loop|20
     local.get $13
     local.get $9
     local.get $1
     i32.const 2
     i32.shl
     i32.add
     i32.load
     i32.gt_s
     if
      local.get $1
      i32.const 1
      i32.add
      local.set $1
      i32.const 1
      call $assembly/bz2/getBits
      i32.const 255
      i32.and
      local.get $13
      i32.const 1
      i32.shl
      i32.or
      local.set $13
      br $for-loop|20
     end
    end
    local.get $0
    local.get $13
    local.get $8
    local.get $1
    i32.const 2
    i32.shl
    i32.add
    i32.load
    i32.sub
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.set $13
    loop $while-continue|21
     local.get $6
     local.get $13
     i32.ne
     if
      local.get $13
      i32.eqz
      local.get $13
      i32.const 1
      i32.eq
      i32.or
      if
       i32.const -1
       local.set $4
       i32.const 1
       local.set $3
       loop $do-loop|22
        local.get $13
        if (result i32)
         local.get $4
         local.get $3
         i32.const 1
         i32.shl
         i32.add
         local.get $4
         local.get $13
         i32.const 1
         i32.eq
         select
        else
         local.get $3
         local.get $4
         i32.add
        end
        local.set $4
        local.get $3
        i32.const 1
        i32.shl
        local.set $3
        local.get $10
        i32.eqz
        if
         i32.const 50
         local.set $10
         local.get $7
         i32.const 1
         i32.add
         local.tee $7
         global.get $assembly/bz2/state
         i32.load offset=120
         i32.add
         i32.load8_u
         i32.const 2
         i32.shl
         local.tee $0
         global.get $assembly/bz2/state
         i32.load offset=144
         i32.add
         i32.load
         local.set $2
         local.get $0
         global.get $assembly/bz2/state
         i32.load offset=132
         i32.load offset=4
         i32.add
         i32.load
         local.set $9
         local.get $0
         global.get $assembly/bz2/state
         i32.load offset=136
         i32.load offset=4
         i32.add
         i32.load
         local.set $8
         local.get $0
         global.get $assembly/bz2/state
         i32.load offset=140
         i32.load offset=4
         i32.add
         i32.load
         local.set $0
        end
        local.get $10
        i32.const 1
        i32.sub
        local.set $10
        local.get $2
        local.tee $1
        call $assembly/bz2/getBits
        local.set $13
        loop $for-loop|23
         local.get $13
         local.get $9
         local.get $1
         i32.const 2
         i32.shl
         i32.add
         i32.load
         i32.gt_s
         if
          local.get $1
          i32.const 1
          i32.add
          local.set $1
          i32.const 1
          call $assembly/bz2/getBits
          i32.const 255
          i32.and
          local.get $13
          i32.const 1
          i32.shl
          i32.or
          local.set $13
          br $for-loop|23
         end
        end
        local.get $0
        local.get $13
        local.get $8
        local.get $1
        i32.const 2
        i32.shl
        i32.add
        i32.load
        i32.sub
        i32.const 2
        i32.shl
        i32.add
        i32.load
        local.tee $13
        i32.eqz
        local.get $13
        i32.const 1
        i32.eq
        i32.or
        br_if $do-loop|22
       end
       global.get $assembly/bz2/state
       i32.load offset=88
       global.get $assembly/bz2/state
       i32.load offset=108
       global.get $assembly/bz2/state
       i32.load offset=112
       global.get $assembly/bz2/state
       i32.load offset=116
       i32.load
       i32.add
       i32.load8_u
       i32.add
       i32.load8_u
       local.tee $3
       i32.const 2
       i32.shl
       i32.add
       local.tee $1
       local.get $4
       i32.const 1
       i32.add
       local.tee $4
       local.get $1
       i32.load
       i32.add
       i32.store
       loop $while-continue|24
        local.get $4
        i32.const 0
        i32.gt_s
        if
         global.get $assembly/bz2/BZip2State.tt
         local.get $11
         i32.const 2
         i32.shl
         i32.add
         local.get $3
         i32.store
         local.get $11
         i32.const 1
         i32.add
         local.set $11
         local.get $4
         i32.const 1
         i32.sub
         local.set $4
         br $while-continue|24
        end
       end
      else
       local.get $13
       i32.const 1
       i32.sub
       local.tee $12
       i32.const 16
       i32.lt_s
       if
        global.get $assembly/bz2/state
        i32.load offset=112
        global.get $assembly/bz2/state
        i32.load offset=116
        i32.load
        local.tee $4
        local.get $12
        i32.add
        i32.add
        i32.load8_u
        local.set $13
        loop $while-continue|25
         local.get $12
         i32.const 3
         i32.gt_s
         if
          local.get $4
          local.get $12
          i32.add
          local.tee $3
          i32.const 1
          i32.sub
          local.set $5
          global.get $assembly/bz2/state
          i32.load offset=112
          local.tee $1
          local.get $3
          i32.add
          local.get $1
          local.get $5
          i32.add
          i32.load8_u
          i32.store8
          global.get $assembly/bz2/state
          i32.load offset=112
          local.get $5
          i32.add
          global.get $assembly/bz2/state
          i32.load offset=112
          local.get $3
          i32.const 2
          i32.sub
          i32.add
          i32.load8_u
          i32.store8
          global.get $assembly/bz2/state
          i32.load offset=112
          local.get $3
          i32.const 2
          i32.sub
          i32.add
          global.get $assembly/bz2/state
          i32.load offset=112
          local.get $3
          i32.const 3
          i32.sub
          i32.add
          i32.load8_u
          i32.store8
          global.get $assembly/bz2/state
          i32.load offset=112
          local.get $3
          i32.const 3
          i32.sub
          i32.add
          global.get $assembly/bz2/state
          i32.load offset=112
          local.get $3
          i32.const 4
          i32.sub
          i32.add
          i32.load8_u
          i32.store8
          local.get $12
          i32.const 4
          i32.sub
          local.set $12
          br $while-continue|25
         end
        end
        loop $while-continue|26
         local.get $12
         i32.const 0
         i32.gt_s
         if
          global.get $assembly/bz2/state
          i32.load offset=112
          local.tee $3
          local.get $4
          local.get $12
          i32.add
          local.tee $1
          i32.add
          local.get $1
          i32.const 1
          i32.sub
          local.get $3
          i32.add
          i32.load8_u
          i32.store8
          local.get $12
          i32.const 1
          i32.sub
          local.set $12
          br $while-continue|26
         end
        end
        global.get $assembly/bz2/state
        i32.load offset=112
        local.get $4
        i32.add
        local.get $13
        i32.store8
       else
        global.get $assembly/bz2/state
        i32.load offset=116
        local.get $12
        i32.const 16
        i32.div_s
        local.tee $3
        i32.const 2
        i32.shl
        i32.add
        i32.load
        local.get $12
        i32.const 16
        i32.rem_s
        i32.add
        local.tee $1
        global.get $assembly/bz2/state
        i32.load offset=112
        i32.add
        i32.load8_u
        local.set $13
        loop $while-continue|27
         local.get $1
         global.get $assembly/bz2/state
         i32.load offset=116
         local.get $3
         i32.const 2
         i32.shl
         i32.add
         i32.load
         i32.gt_s
         if
          global.get $assembly/bz2/state
          i32.load offset=112
          local.tee $4
          local.get $1
          i32.add
          local.get $4
          local.get $1
          i32.const 1
          i32.sub
          local.tee $1
          i32.add
          i32.load8_u
          i32.store8
          br $while-continue|27
         end
        end
        global.get $assembly/bz2/state
        i32.load offset=116
        local.get $3
        i32.const 2
        i32.shl
        i32.add
        local.tee $1
        local.get $1
        i32.load
        i32.const 1
        i32.add
        i32.store
        loop $while-continue|28
         local.get $3
         i32.const 0
         i32.gt_s
         if
          global.get $assembly/bz2/state
          i32.load offset=116
          local.get $3
          i32.const 2
          i32.shl
          i32.add
          local.tee $1
          local.get $1
          i32.load
          i32.const 1
          i32.sub
          i32.store
          global.get $assembly/bz2/state
          i32.load offset=112
          local.tee $1
          global.get $assembly/bz2/state
          i32.load offset=116
          local.get $3
          i32.const 2
          i32.shl
          i32.add
          i32.load
          i32.add
          local.get $1
          global.get $assembly/bz2/state
          i32.load offset=116
          local.get $3
          i32.const 1
          i32.sub
          local.tee $3
          i32.const 2
          i32.shl
          i32.add
          i32.load
          i32.const 15
          i32.add
          i32.add
          i32.load8_u
          i32.store8
          br $while-continue|28
         end
        end
        global.get $assembly/bz2/state
        i32.load offset=116
        local.tee $1
        local.get $1
        i32.load
        i32.const 1
        i32.sub
        i32.store
        global.get $assembly/bz2/state
        i32.load offset=112
        global.get $assembly/bz2/state
        i32.load offset=116
        i32.load
        i32.add
        local.get $13
        i32.store8
        global.get $assembly/bz2/state
        i32.load offset=116
        i32.load
        i32.eqz
        if
         i32.const 4095
         local.set $12
         i32.const 15
         local.set $4
         loop $for-loop|29
          local.get $4
          i32.const 0
          i32.ge_s
          if
           i32.const 15
           local.set $3
           loop $for-loop|30
            local.get $3
            i32.const 0
            i32.ge_s
            if
             global.get $assembly/bz2/state
             i32.load offset=112
             local.tee $1
             local.get $12
             i32.add
             local.get $3
             global.get $assembly/bz2/state
             i32.load offset=116
             local.get $4
             i32.const 2
             i32.shl
             i32.add
             i32.load
             i32.add
             local.get $1
             i32.add
             i32.load8_u
             i32.store8
             local.get $12
             i32.const 1
             i32.sub
             local.set $12
             local.get $3
             i32.const 1
             i32.sub
             local.set $3
             br $for-loop|30
            end
           end
           global.get $assembly/bz2/state
           i32.load offset=116
           local.get $4
           i32.const 2
           i32.shl
           i32.add
           local.get $12
           i32.const 1
           i32.add
           i32.store
           local.get $4
           i32.const 1
           i32.sub
           local.set $4
           br $for-loop|29
          end
         end
        end
       end
       global.get $assembly/bz2/state
       i32.load offset=88
       global.get $assembly/bz2/state
       i32.load offset=108
       local.get $13
       i32.add
       i32.load8_u
       i32.const 2
       i32.shl
       i32.add
       local.tee $1
       local.get $1
       i32.load
       i32.const 1
       i32.add
       i32.store
       global.get $assembly/bz2/BZip2State.tt
       local.get $11
       i32.const 2
       i32.shl
       i32.add
       global.get $assembly/bz2/state
       i32.load offset=108
       local.get $13
       i32.add
       i32.load8_u
       i32.store
       local.get $11
       i32.const 1
       i32.add
       local.set $11
       local.get $10
       i32.eqz
       if
        i32.const 50
        local.set $10
        local.get $7
        i32.const 1
        i32.add
        local.tee $7
        global.get $assembly/bz2/state
        i32.load offset=120
        i32.add
        i32.load8_u
        i32.const 2
        i32.shl
        local.tee $0
        global.get $assembly/bz2/state
        i32.load offset=144
        i32.add
        i32.load
        local.set $2
        local.get $0
        global.get $assembly/bz2/state
        i32.load offset=132
        i32.load offset=4
        i32.add
        i32.load
        local.set $9
        local.get $0
        global.get $assembly/bz2/state
        i32.load offset=136
        i32.load offset=4
        i32.add
        i32.load
        local.set $8
        local.get $0
        global.get $assembly/bz2/state
        i32.load offset=140
        i32.load offset=4
        i32.add
        i32.load
        local.set $0
       end
       local.get $10
       i32.const 1
       i32.sub
       local.set $10
       local.get $2
       local.tee $1
       call $assembly/bz2/getBits
       local.set $13
       loop $for-loop|31
        local.get $13
        local.get $9
        local.get $1
        i32.const 2
        i32.shl
        i32.add
        i32.load
        i32.gt_s
        if
         local.get $1
         i32.const 1
         i32.add
         local.set $1
         i32.const 1
         call $assembly/bz2/getBits
         i32.const 255
         i32.and
         local.get $13
         i32.const 1
         i32.shl
         i32.or
         local.set $13
         br $for-loop|31
        end
       end
       local.get $0
       local.get $13
       local.get $8
       local.get $1
       i32.const 2
       i32.shl
       i32.add
       i32.load
       i32.sub
       i32.const 2
       i32.shl
       i32.add
       i32.load
       local.set $13
      end
      br $while-continue|21
     end
    end
    global.get $assembly/bz2/state
    i32.load offset=92
    i32.const 0
    i32.store
    i32.const 1
    local.set $2
    loop $for-loop|32
     local.get $2
     i32.const 256
     i32.le_s
     if
      global.get $assembly/bz2/state
      i32.load offset=92
      local.get $2
      i32.const 2
      i32.shl
      i32.add
      global.get $assembly/bz2/state
      i32.load offset=88
      local.get $2
      i32.const 1
      i32.sub
      i32.const 2
      i32.shl
      i32.add
      i32.load
      i32.store
      local.get $2
      i32.const 1
      i32.add
      local.set $2
      br $for-loop|32
     end
    end
    i32.const 1
    local.set $3
    loop $for-loop|33
     local.get $3
     i32.const 256
     i32.le_s
     if
      global.get $assembly/bz2/state
      i32.load offset=92
      local.tee $1
      local.get $3
      i32.const 2
      i32.shl
      i32.add
      local.tee $0
      local.get $0
      i32.load
      local.get $3
      i32.const 1
      i32.sub
      i32.const 2
      i32.shl
      local.get $1
      i32.add
      i32.load
      i32.add
      i32.store
      local.get $3
      i32.const 1
      i32.add
      local.set $3
      br $for-loop|33
     end
    end
    global.get $assembly/bz2/state
    i32.const 0
    i32.store offset=44
    global.get $assembly/bz2/state
    i32.const 0
    i32.store8 offset=40
    i32.const 0
    local.set $3
    loop $for-loop|34
     local.get $3
     local.get $11
     i32.lt_s
     if
      global.get $assembly/bz2/BZip2State.tt
      global.get $assembly/bz2/state
      i32.load offset=92
      global.get $assembly/bz2/BZip2State.tt
      local.get $3
      i32.const 2
      i32.shl
      i32.add
      i32.load
      i32.const 255
      i32.and
      local.tee $1
      i32.const 2
      i32.shl
      i32.add
      i32.load
      i32.const 2
      i32.shl
      i32.add
      local.tee $0
      local.get $0
      i32.load
      local.get $3
      i32.const 8
      i32.shl
      i32.or
      i32.store
      global.get $assembly/bz2/state
      i32.load offset=92
      local.get $1
      i32.const 2
      i32.shl
      i32.add
      local.tee $0
      local.get $0
      i32.load
      i32.const 1
      i32.add
      i32.store
      local.get $3
      i32.const 1
      i32.add
      local.set $3
      br $for-loop|34
     end
    end
    global.get $assembly/bz2/state
    global.get $assembly/bz2/BZip2State.tt
    global.get $assembly/bz2/state
    i32.load offset=64
    i32.const 2
    i32.shl
    i32.add
    i32.load
    i32.const 8
    i32.shr_s
    i32.store offset=68
    global.get $assembly/bz2/state
    i32.const 0
    i32.store offset=76
    global.get $assembly/bz2/state
    global.get $assembly/bz2/BZip2State.tt
    global.get $assembly/bz2/state
    i32.load offset=68
    i32.const 2
    i32.shl
    i32.add
    i32.load
    i32.store offset=68
    global.get $assembly/bz2/state
    global.get $assembly/bz2/state
    i32.load offset=68
    i32.const 255
    i32.and
    i32.store offset=72
    global.get $assembly/bz2/state
    global.get $assembly/bz2/state
    i32.load offset=68
    i32.const 8
    i32.shr_s
    i32.store offset=68
    global.get $assembly/bz2/state
    global.get $assembly/bz2/state
    i32.load offset=76
    i32.const 1
    i32.add
    i32.store offset=76
    global.get $assembly/bz2/state
    local.get $11
    i32.store offset=84
    call $assembly/bz2/finish
    global.get $assembly/bz2/state
    i32.load offset=76
    global.get $assembly/bz2/state
    i32.load offset=84
    i32.const 1
    i32.add
    i32.eq
    if (result i32)
     global.get $assembly/bz2/state
     i32.load offset=44
    else
     i32.const 1
    end
    i32.eqz
    local.set $2
    br $while-continue|0
   end
  end
 )
 (func $assembly/bz2/read (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (result i32)
  global.get $assembly/bz2/state
  local.get $1
  i32.store
  global.get $assembly/bz2/state
  local.get $3
  i32.store offset=8
  global.get $assembly/bz2/state
  local.get $0
  call $~lib/staticarray/StaticArray<i8>#constructor
  i32.store offset=4
  global.get $assembly/bz2/state
  i32.const 0
  i32.store offset=24
  global.get $assembly/bz2/state
  local.get $2
  i32.store offset=12
  global.get $assembly/bz2/state
  local.get $0
  i32.store offset=28
  global.get $assembly/bz2/state
  i32.const 0
  i32.store offset=56
  global.get $assembly/bz2/state
  i32.const 0
  i32.store offset=52
  global.get $assembly/bz2/state
  i32.const 0
  i32.store offset=16
  global.get $assembly/bz2/state
  i32.const 0
  i32.store offset=20
  global.get $assembly/bz2/state
  i32.const 0
  i32.store offset=32
  global.get $assembly/bz2/state
  i32.const 0
  i32.store offset=36
  global.get $assembly/bz2/state
  i32.const 0
  i32.store offset=60
  call $assembly/bz2/decompress
  global.get $assembly/bz2/state
  i32.load offset=4
 )
 (func $~lib/rt/tcms/__pin (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  local.get $0
  if
   local.get $0
   i32.const 20
   i32.sub
   local.tee $1
   i32.load offset=4
   i32.const 3
   i32.and
   i32.const 3
   i32.eq
   if
    i32.const 1616
    i32.const 1232
    i32.const 181
    i32.const 7
    call $~lib/builtins/abort
    unreachable
   end
   block $__inlined_func$~lib/rt/tcms/Object#unlink$4
    local.get $1
    i32.load offset=4
    i32.const -4
    i32.and
    local.tee $2
    i32.eqz
    if
     local.get $1
     i32.load offset=8
     drop
     br $__inlined_func$~lib/rt/tcms/Object#unlink$4
    end
    local.get $2
    local.get $1
    i32.load offset=8
    local.tee $3
    i32.store offset=8
    local.get $3
    local.get $2
    local.get $3
    i32.load offset=4
    i32.const 3
    i32.and
    i32.or
    i32.store offset=4
   end
   global.get $~lib/rt/tcms/pinSpace
   local.tee $2
   i32.load offset=8
   local.set $3
   local.get $1
   local.get $2
   i32.const 3
   i32.or
   i32.store offset=4
   local.get $1
   local.get $3
   i32.store offset=8
   local.get $3
   local.get $1
   local.get $3
   i32.load offset=4
   i32.const 3
   i32.and
   i32.or
   i32.store offset=4
   local.get $2
   local.get $1
   i32.store offset=8
  end
  local.get $0
 )
 (func $~lib/rt/tcms/__unpin (param $0 i32)
  (local $1 i32)
  (local $2 i32)
  local.get $0
  i32.eqz
  if
   return
  end
  local.get $0
  i32.const 20
  i32.sub
  local.tee $0
  i32.load offset=4
  i32.const 3
  i32.and
  i32.const 3
  i32.ne
  if
   i32.const 1712
   i32.const 1232
   i32.const 195
   i32.const 5
   call $~lib/builtins/abort
   unreachable
  end
  block $__inlined_func$~lib/rt/tcms/Object#unlink$5
   local.get $0
   i32.load offset=4
   i32.const -4
   i32.and
   local.tee $1
   i32.eqz
   if
    local.get $0
    i32.load offset=8
    drop
    br $__inlined_func$~lib/rt/tcms/Object#unlink$5
   end
   local.get $1
   local.get $0
   i32.load offset=8
   local.tee $2
   i32.store offset=8
   local.get $2
   local.get $1
   local.get $2
   i32.load offset=4
   i32.const 3
   i32.and
   i32.or
   i32.store offset=4
  end
  global.get $~lib/rt/tcms/fromSpace
  local.tee $1
  i32.load offset=8
  local.set $2
  local.get $0
  local.get $1
  global.get $~lib/rt/tcms/white
  i32.or
  i32.store offset=4
  local.get $0
  local.get $2
  i32.store offset=8
  local.get $2
  local.get $0
  local.get $2
  i32.load offset=4
  i32.const 3
  i32.and
  i32.or
  i32.store offset=4
  local.get $1
  local.get $0
  i32.store offset=8
 )
 (func $~lib/rt/tcms/__collect
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  global.get $assembly/bz2/BZip2State.tt
  local.tee $0
  if
   global.get $~lib/rt/tcms/white
   local.get $0
   i32.const 20
   i32.sub
   local.tee $2
   i32.load offset=4
   local.tee $0
   i32.const 3
   i32.and
   i32.eq
   if
    block $__inlined_func$~lib/rt/tcms/Object#unlink$6
     local.get $0
     i32.const -4
     i32.and
     local.tee $1
     i32.eqz
     if
      local.get $2
      i32.load offset=8
      drop
      br $__inlined_func$~lib/rt/tcms/Object#unlink$6
     end
     local.get $1
     local.get $2
     i32.load offset=8
     local.tee $0
     i32.store offset=8
     local.get $0
     local.get $1
     local.get $0
     i32.load offset=4
     i32.const 3
     i32.and
     i32.or
     i32.store offset=4
    end
    global.get $~lib/rt/tcms/toSpace
    local.tee $1
    i32.load offset=8
    local.set $0
    local.get $2
    local.get $1
    global.get $~lib/rt/tcms/white
    i32.eqz
    i32.or
    i32.store offset=4
    local.get $2
    local.get $0
    i32.store offset=8
    local.get $0
    local.get $2
    local.get $0
    i32.load offset=4
    i32.const 3
    i32.and
    i32.or
    i32.store offset=4
    local.get $1
    local.get $2
    i32.store offset=8
   end
  end
  global.get $assembly/bz2/state
  local.tee $0
  if
   global.get $~lib/rt/tcms/white
   local.get $0
   i32.const 20
   i32.sub
   local.tee $2
   i32.load offset=4
   local.tee $0
   i32.const 3
   i32.and
   i32.eq
   if
    block $__inlined_func$~lib/rt/tcms/Object#unlink$60
     local.get $0
     i32.const -4
     i32.and
     local.tee $1
     i32.eqz
     if
      local.get $2
      i32.load offset=8
      drop
      br $__inlined_func$~lib/rt/tcms/Object#unlink$60
     end
     local.get $1
     local.get $2
     i32.load offset=8
     local.tee $0
     i32.store offset=8
     local.get $0
     local.get $1
     local.get $0
     i32.load offset=4
     i32.const 3
     i32.and
     i32.or
     i32.store offset=4
    end
    global.get $~lib/rt/tcms/toSpace
    local.tee $1
    i32.load offset=8
    local.set $0
    local.get $2
    local.get $1
    global.get $~lib/rt/tcms/white
    i32.eqz
    i32.or
    i32.store offset=4
    local.get $2
    local.get $0
    i32.store offset=8
    local.get $0
    local.get $2
    local.get $0
    i32.load offset=4
    i32.const 3
    i32.and
    i32.or
    i32.store offset=4
    local.get $1
    local.get $2
    i32.store offset=8
   end
  end
  global.get $~lib/rt/tcms/white
  i32.const 1040
  i32.load
  local.tee $0
  i32.const 3
  i32.and
  i32.eq
  if
   block $__inlined_func$~lib/rt/tcms/Object#unlink$61
    local.get $0
    i32.const -4
    i32.and
    local.tee $1
    i32.eqz
    if
     i32.const 1044
     i32.load
     drop
     br $__inlined_func$~lib/rt/tcms/Object#unlink$61
    end
    local.get $1
    i32.const 1044
    i32.load
    local.tee $0
    i32.store offset=8
    local.get $0
    local.get $1
    local.get $0
    i32.load offset=4
    i32.const 3
    i32.and
    i32.or
    i32.store offset=4
   end
   global.get $~lib/rt/tcms/toSpace
   local.tee $1
   i32.load offset=8
   local.set $0
   i32.const 1040
   local.get $1
   global.get $~lib/rt/tcms/white
   i32.eqz
   i32.or
   i32.store
   i32.const 1044
   local.get $0
   i32.store
   local.get $0
   local.get $0
   i32.load offset=4
   i32.const 3
   i32.and
   i32.const 1036
   i32.or
   i32.store offset=4
   local.get $1
   i32.const 1036
   i32.store offset=8
  end
  global.get $~lib/rt/tcms/white
  i32.const 1152
  i32.load
  local.tee $0
  i32.const 3
  i32.and
  i32.eq
  if
   block $__inlined_func$~lib/rt/tcms/Object#unlink$62
    local.get $0
    i32.const -4
    i32.and
    local.tee $1
    i32.eqz
    if
     i32.const 1156
     i32.load
     drop
     br $__inlined_func$~lib/rt/tcms/Object#unlink$62
    end
    local.get $1
    i32.const 1156
    i32.load
    local.tee $0
    i32.store offset=8
    local.get $0
    local.get $1
    local.get $0
    i32.load offset=4
    i32.const 3
    i32.and
    i32.or
    i32.store offset=4
   end
   global.get $~lib/rt/tcms/toSpace
   local.tee $1
   i32.load offset=8
   local.set $0
   i32.const 1152
   local.get $1
   global.get $~lib/rt/tcms/white
   i32.eqz
   i32.or
   i32.store
   i32.const 1156
   local.get $0
   i32.store
   local.get $0
   local.get $0
   i32.load offset=4
   i32.const 3
   i32.and
   i32.const 1148
   i32.or
   i32.store offset=4
   local.get $1
   i32.const 1148
   i32.store offset=8
  end
  global.get $~lib/rt/tcms/white
  i32.const 1600
  i32.load
  local.tee $0
  i32.const 3
  i32.and
  i32.eq
  if
   block $__inlined_func$~lib/rt/tcms/Object#unlink$63
    local.get $0
    i32.const -4
    i32.and
    local.tee $1
    i32.eqz
    if
     i32.const 1604
     i32.load
     drop
     br $__inlined_func$~lib/rt/tcms/Object#unlink$63
    end
    local.get $1
    i32.const 1604
    i32.load
    local.tee $0
    i32.store offset=8
    local.get $0
    local.get $1
    local.get $0
    i32.load offset=4
    i32.const 3
    i32.and
    i32.or
    i32.store offset=4
   end
   global.get $~lib/rt/tcms/toSpace
   local.tee $1
   i32.load offset=8
   local.set $0
   i32.const 1600
   local.get $1
   global.get $~lib/rt/tcms/white
   i32.eqz
   i32.or
   i32.store
   i32.const 1604
   local.get $0
   i32.store
   local.get $0
   local.get $0
   i32.load offset=4
   i32.const 3
   i32.and
   i32.const 1596
   i32.or
   i32.store offset=4
   local.get $1
   i32.const 1596
   i32.store offset=8
  end
  global.get $~lib/rt/tcms/white
  i32.const 1696
  i32.load
  local.tee $0
  i32.const 3
  i32.and
  i32.eq
  if
   block $__inlined_func$~lib/rt/tcms/Object#unlink$64
    local.get $0
    i32.const -4
    i32.and
    local.tee $1
    i32.eqz
    if
     i32.const 1700
     i32.load
     drop
     br $__inlined_func$~lib/rt/tcms/Object#unlink$64
    end
    local.get $1
    i32.const 1700
    i32.load
    local.tee $0
    i32.store offset=8
    local.get $0
    local.get $1
    local.get $0
    i32.load offset=4
    i32.const 3
    i32.and
    i32.or
    i32.store offset=4
   end
   global.get $~lib/rt/tcms/toSpace
   local.tee $1
   i32.load offset=8
   local.set $0
   i32.const 1696
   local.get $1
   global.get $~lib/rt/tcms/white
   i32.eqz
   i32.or
   i32.store
   i32.const 1700
   local.get $0
   i32.store
   local.get $0
   local.get $0
   i32.load offset=4
   i32.const 3
   i32.and
   i32.const 1692
   i32.or
   i32.store offset=4
   local.get $1
   i32.const 1692
   i32.store offset=8
  end
  global.get $~lib/rt/tcms/pinSpace
  local.tee $0
  i32.load offset=4
  i32.const -4
  i32.and
  local.set $1
  loop $while-continue|0
   local.get $0
   local.get $1
   i32.ne
   if
    local.get $1
    i32.load offset=4
    drop
    local.get $1
    i32.const 20
    i32.add
    call $~lib/rt/__visit_members
    local.get $1
    i32.load offset=4
    i32.const -4
    i32.and
    local.set $1
    br $while-continue|0
   end
  end
  global.get $~lib/rt/tcms/white
  i32.eqz
  local.set $4
  global.get $~lib/rt/tcms/toSpace
  local.tee $5
  i32.load offset=4
  i32.const -4
  i32.and
  local.set $1
  loop $while-continue|1
   local.get $1
   local.get $5
   i32.ne
   if
    local.get $1
    i32.load offset=4
    drop
    local.get $1
    i32.const 20
    i32.add
    call $~lib/rt/__visit_members
    local.get $1
    i32.load offset=4
    i32.const -4
    i32.and
    local.set $1
    br $while-continue|1
   end
  end
  global.get $~lib/rt/tcms/fromSpace
  local.tee $2
  i32.load offset=4
  i32.const -4
  i32.and
  local.set $1
  loop $while-continue|2
   local.get $1
   local.get $2
   i32.ne
   if
    local.get $1
    i32.load offset=4
    i32.const -4
    i32.and
    local.set $0
    local.get $1
    i32.const 1860
    i32.lt_u
    if
     local.get $1
     i32.const 0
     i32.store offset=4
     local.get $1
     i32.const 0
     i32.store offset=8
    else
     global.get $~lib/rt/tcms/total
     local.get $1
     i32.load
     i32.const -4
     i32.and
     i32.const 4
     i32.add
     i32.sub
     global.set $~lib/rt/tcms/total
     local.get $1
     i32.const 4
     i32.add
     local.tee $1
     i32.const 1860
     i32.ge_u
     if
      global.get $~lib/rt/tlsf/ROOT
      i32.eqz
      if
       call $~lib/rt/tlsf/initialize
      end
      local.get $1
      i32.const 4
      i32.sub
      local.set $3
      local.get $1
      i32.const 15
      i32.and
      i32.const 1
      local.get $1
      select
      i32.eqz
      if
       local.get $3
       i32.load
       drop
      end
      local.get $3
      local.get $3
      i32.load
      i32.const 1
      i32.or
      i32.store
      global.get $~lib/rt/tlsf/ROOT
      local.get $3
      call $~lib/rt/tlsf/insertBlock
     end
    end
    local.get $0
    local.set $1
    br $while-continue|2
   end
  end
  local.get $2
  local.get $2
  i32.store offset=4
  local.get $2
  local.get $2
  i32.store offset=8
  local.get $5
  global.set $~lib/rt/tcms/fromSpace
  local.get $2
  global.set $~lib/rt/tcms/toSpace
  local.get $4
  global.set $~lib/rt/tcms/white
 )
 (func $~lib/array/Array<~lib/staticarray/StaticArray<u8>>~visit (param $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  local.get $0
  i32.load offset=4
  local.tee $1
  local.get $0
  i32.load offset=12
  i32.const 2
  i32.shl
  i32.add
  local.set $2
  loop $while-continue|0
   local.get $1
   local.get $2
   i32.lt_u
   if
    local.get $1
    i32.load
    local.tee $3
    if
     global.get $~lib/rt/tcms/white
     local.get $3
     i32.const 20
     i32.sub
     local.tee $3
     i32.load offset=4
     local.tee $4
     i32.const 3
     i32.and
     i32.eq
     if
      block $__inlined_func$~lib/rt/tcms/Object#unlink$6
       local.get $4
       i32.const -4
       i32.and
       local.tee $4
       i32.eqz
       if
        local.get $3
        i32.load offset=8
        drop
        br $__inlined_func$~lib/rt/tcms/Object#unlink$6
       end
       local.get $4
       local.get $3
       i32.load offset=8
       local.tee $5
       i32.store offset=8
       local.get $5
       local.get $4
       local.get $5
       i32.load offset=4
       i32.const 3
       i32.and
       i32.or
       i32.store offset=4
      end
      global.get $~lib/rt/tcms/toSpace
      local.tee $4
      i32.load offset=8
      local.set $5
      local.get $3
      local.get $4
      global.get $~lib/rt/tcms/white
      i32.eqz
      i32.or
      i32.store offset=4
      local.get $3
      local.get $5
      i32.store offset=8
      local.get $5
      local.get $3
      local.get $5
      i32.load offset=4
      i32.const 3
      i32.and
      i32.or
      i32.store offset=4
      local.get $4
      local.get $3
      i32.store offset=8
     end
    end
    local.get $1
    i32.const 4
    i32.add
    local.set $1
    br $while-continue|0
   end
  end
  local.get $0
  i32.load
  local.tee $0
  if
   global.get $~lib/rt/tcms/white
   local.get $0
   i32.const 20
   i32.sub
   local.tee $0
   i32.load offset=4
   local.tee $1
   i32.const 3
   i32.and
   i32.eq
   if
    block $__inlined_func$~lib/rt/tcms/Object#unlink$60
     local.get $1
     i32.const -4
     i32.and
     local.tee $1
     i32.eqz
     if
      local.get $0
      i32.load offset=8
      drop
      br $__inlined_func$~lib/rt/tcms/Object#unlink$60
     end
     local.get $1
     local.get $0
     i32.load offset=8
     local.tee $2
     i32.store offset=8
     local.get $2
     local.get $1
     local.get $2
     i32.load offset=4
     i32.const 3
     i32.and
     i32.or
     i32.store offset=4
    end
    global.get $~lib/rt/tcms/toSpace
    local.tee $1
    i32.load offset=8
    local.set $2
    local.get $0
    local.get $1
    global.get $~lib/rt/tcms/white
    i32.eqz
    i32.or
    i32.store offset=4
    local.get $0
    local.get $2
    i32.store offset=8
    local.get $2
    local.get $0
    local.get $2
    i32.load offset=4
    i32.const 3
    i32.and
    i32.or
    i32.store offset=4
    local.get $1
    local.get $0
    i32.store offset=8
   end
  end
 )
 (func $~lib/staticarray/StaticArray<~lib/staticarray/StaticArray<u8>>~visit (param $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  local.get $0
  local.get $0
  i32.const 20
  i32.sub
  i32.load offset=16
  i32.add
  local.set $1
  loop $while-continue|0
   local.get $0
   local.get $1
   i32.lt_u
   if
    local.get $0
    i32.load
    local.tee $2
    if
     global.get $~lib/rt/tcms/white
     local.get $2
     i32.const 20
     i32.sub
     local.tee $2
     i32.load offset=4
     local.tee $3
     i32.const 3
     i32.and
     i32.eq
     if
      block $__inlined_func$~lib/rt/tcms/Object#unlink$6
       local.get $3
       i32.const -4
       i32.and
       local.tee $3
       i32.eqz
       if
        local.get $2
        i32.load offset=8
        drop
        br $__inlined_func$~lib/rt/tcms/Object#unlink$6
       end
       local.get $3
       local.get $2
       i32.load offset=8
       local.tee $4
       i32.store offset=8
       local.get $4
       local.get $3
       local.get $4
       i32.load offset=4
       i32.const 3
       i32.and
       i32.or
       i32.store offset=4
      end
      global.get $~lib/rt/tcms/toSpace
      local.tee $3
      i32.load offset=8
      local.set $4
      local.get $2
      local.get $3
      global.get $~lib/rt/tcms/white
      i32.eqz
      i32.or
      i32.store offset=4
      local.get $2
      local.get $4
      i32.store offset=8
      local.get $4
      local.get $2
      local.get $4
      i32.load offset=4
      i32.const 3
      i32.and
      i32.or
      i32.store offset=4
      local.get $3
      local.get $2
      i32.store offset=8
     end
    end
    local.get $0
    i32.const 4
    i32.add
    local.set $0
    br $while-continue|0
   end
  end
 )
 (func $~lib/rt/__visit_members (param $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  block $folding-inner1
   block $folding-inner0
    block $invalid
     block $~lib/staticarray/StaticArray<~lib/staticarray/StaticArray<i32>>
      block $~lib/staticarray/StaticArray<~lib/staticarray/StaticArray<u8>>
       block $~lib/array/Array<~lib/staticarray/StaticArray<i32>>
        block $~lib/array/Array<~lib/staticarray/StaticArray<u8>>
         block $~lib/staticarray/StaticArray<u8>
          block $~lib/staticarray/StaticArray<bool>
           block $~lib/staticarray/StaticArray<i8>
            block $assembly/bz2/BZip2State
             block $~lib/staticarray/StaticArray<i32>
              block $~lib/string/String
               block $~lib/arraybuffer/ArrayBuffer
                block $~lib/object/Object
                 local.get $0
                 i32.const 8
                 i32.sub
                 i32.load
                 br_table $~lib/object/Object $~lib/arraybuffer/ArrayBuffer $~lib/string/String $folding-inner1 $~lib/staticarray/StaticArray<i32> $assembly/bz2/BZip2State $~lib/staticarray/StaticArray<i8> $~lib/staticarray/StaticArray<bool> $~lib/staticarray/StaticArray<u8> $~lib/array/Array<~lib/staticarray/StaticArray<u8>> $~lib/array/Array<~lib/staticarray/StaticArray<i32>> $~lib/staticarray/StaticArray<~lib/staticarray/StaticArray<u8>> $folding-inner0 $folding-inner1 $~lib/staticarray/StaticArray<~lib/staticarray/StaticArray<i32>> $folding-inner0 $invalid
                end
                return
               end
               return
              end
              return
             end
             return
            end
            local.get $0
            i32.load
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$60
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$60
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=4
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$61
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$61
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=88
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$62
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$62
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=92
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$63
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$63
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=96
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$64
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$64
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=100
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$65
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$65
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=104
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$66
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$66
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=108
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$67
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$67
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=112
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$68
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$68
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=116
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$69
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$69
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=120
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$610
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$610
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=124
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$611
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$611
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=128
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$612
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$612
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=132
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$613
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$613
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=136
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$614
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$614
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=140
            local.tee $1
            if
             global.get $~lib/rt/tcms/white
             local.get $1
             i32.const 20
             i32.sub
             local.tee $1
             i32.load offset=4
             local.tee $2
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$615
               local.get $2
               i32.const -4
               i32.and
               local.tee $2
               i32.eqz
               if
                local.get $1
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$615
               end
               local.get $2
               local.get $1
               i32.load offset=8
               local.tee $3
               i32.store offset=8
               local.get $3
               local.get $2
               local.get $3
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $2
              i32.load offset=8
              local.set $3
              local.get $1
              local.get $2
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $1
              local.get $3
              i32.store offset=8
              local.get $3
              local.get $1
              local.get $3
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $2
              local.get $1
              i32.store offset=8
             end
            end
            local.get $0
            i32.load offset=144
            local.tee $0
            if
             global.get $~lib/rt/tcms/white
             local.get $0
             i32.const 20
             i32.sub
             local.tee $0
             i32.load offset=4
             local.tee $1
             i32.const 3
             i32.and
             i32.eq
             if
              block $__inlined_func$~lib/rt/tcms/Object#unlink$616
               local.get $1
               i32.const -4
               i32.and
               local.tee $1
               i32.eqz
               if
                local.get $0
                i32.load offset=8
                drop
                br $__inlined_func$~lib/rt/tcms/Object#unlink$616
               end
               local.get $1
               local.get $0
               i32.load offset=8
               local.tee $2
               i32.store offset=8
               local.get $2
               local.get $1
               local.get $2
               i32.load offset=4
               i32.const 3
               i32.and
               i32.or
               i32.store offset=4
              end
              global.get $~lib/rt/tcms/toSpace
              local.tee $1
              i32.load offset=8
              local.set $2
              local.get $0
              local.get $1
              global.get $~lib/rt/tcms/white
              i32.eqz
              i32.or
              i32.store offset=4
              local.get $0
              local.get $2
              i32.store offset=8
              local.get $2
              local.get $0
              local.get $2
              i32.load offset=4
              i32.const 3
              i32.and
              i32.or
              i32.store offset=4
              local.get $1
              local.get $0
              i32.store offset=8
             end
            end
            return
           end
           return
          end
          return
         end
         return
        end
        local.get $0
        call $~lib/array/Array<~lib/staticarray/StaticArray<u8>>~visit
        return
       end
       local.get $0
       call $~lib/array/Array<~lib/staticarray/StaticArray<u8>>~visit
       return
      end
      local.get $0
      call $~lib/staticarray/StaticArray<~lib/staticarray/StaticArray<u8>>~visit
      return
     end
     local.get $0
     call $~lib/staticarray/StaticArray<~lib/staticarray/StaticArray<u8>>~visit
     return
    end
    unreachable
   end
   local.get $0
   i32.load offset=4
   local.tee $0
   if
    global.get $~lib/rt/tcms/white
    local.get $0
    i32.const 20
    i32.sub
    local.tee $0
    i32.load offset=4
    local.tee $1
    i32.const 3
    i32.and
    i32.eq
    if
     block $__inlined_func$~lib/rt/tcms/Object#unlink$617
      local.get $1
      i32.const -4
      i32.and
      local.tee $1
      i32.eqz
      if
       local.get $0
       i32.load offset=8
       drop
       br $__inlined_func$~lib/rt/tcms/Object#unlink$617
      end
      local.get $1
      local.get $0
      i32.load offset=8
      local.tee $2
      i32.store offset=8
      local.get $2
      local.get $1
      local.get $2
      i32.load offset=4
      i32.const 3
      i32.and
      i32.or
      i32.store offset=4
     end
     global.get $~lib/rt/tcms/toSpace
     local.tee $1
     i32.load offset=8
     local.set $2
     local.get $0
     local.get $1
     global.get $~lib/rt/tcms/white
     i32.eqz
     i32.or
     i32.store offset=4
     local.get $0
     local.get $2
     i32.store offset=8
     local.get $2
     local.get $0
     local.get $2
     i32.load offset=4
     i32.const 3
     i32.and
     i32.or
     i32.store offset=4
     local.get $1
     local.get $0
     i32.store offset=8
    end
   end
   return
  end
  local.get $0
  i32.load
  local.tee $0
  if
   global.get $~lib/rt/tcms/white
   local.get $0
   i32.const 20
   i32.sub
   local.tee $0
   i32.load offset=4
   local.tee $1
   i32.const 3
   i32.and
   i32.eq
   if
    block $__inlined_func$~lib/rt/tcms/Object#unlink$6
     local.get $1
     i32.const -4
     i32.and
     local.tee $1
     i32.eqz
     if
      local.get $0
      i32.load offset=8
      drop
      br $__inlined_func$~lib/rt/tcms/Object#unlink$6
     end
     local.get $1
     local.get $0
     i32.load offset=8
     local.tee $2
     i32.store offset=8
     local.get $2
     local.get $1
     local.get $2
     i32.load offset=4
     i32.const 3
     i32.and
     i32.or
     i32.store offset=4
    end
    global.get $~lib/rt/tcms/toSpace
    local.tee $1
    i32.load offset=8
    local.set $2
    local.get $0
    local.get $1
    global.get $~lib/rt/tcms/white
    i32.eqz
    i32.or
    i32.store offset=4
    local.get $0
    local.get $2
    i32.store offset=8
    local.get $2
    local.get $0
    local.get $2
    i32.load offset=4
    i32.const 3
    i32.and
    i32.or
    i32.store offset=4
    local.get $1
    local.get $0
    i32.store offset=8
   end
  end
 )
 (func $~start
  i32.const 1348
  i32.const 1344
  i32.store
  i32.const 1352
  i32.const 1344
  i32.store
  i32.const 1344
  global.set $~lib/rt/tcms/fromSpace
  i32.const 100000
  call $~lib/staticarray/StaticArray<i32>#constructor
  global.set $assembly/bz2/BZip2State.tt
  call $assembly/bz2/BZip2State#constructor
  global.set $assembly/bz2/state
  i32.const 1668
  i32.const 1664
  i32.store
  i32.const 1672
  i32.const 1664
  i32.store
  i32.const 1664
  global.set $~lib/rt/tcms/pinSpace
  i32.const 1764
  i32.const 1760
  i32.store
  i32.const 1768
  i32.const 1760
  i32.store
  i32.const 1760
  global.set $~lib/rt/tcms/toSpace
 )
)
