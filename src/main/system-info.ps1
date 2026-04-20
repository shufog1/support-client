# SolveIT System Information Collector
# Returns JSON data for Node.js consumption

$ErrorActionPreference = "SilentlyContinue"

# Initialize result object
$result = @{
    computer = @{
        name = $env:COMPUTERNAME
        manufacturer = "Unknown"
        model = "Unknown"
        serialNumber = "Unknown"
    }
    operatingSystem = @{
        name = "Unknown"
        version = "Unknown"
        architecture = "Unknown"
    }
    hardware = @{
        processor = @{
            name = "Unknown"
            cores = 0
            maxSpeed = "Unknown"
        }
        memory = @{
            total = "Unknown"
            totalBytes = 0
            slots = @{
                total = 0
                used = 0
                details = @()
            }
        }
        gpu = @()
        storage = @{
            drives = @()
        }
    }
    network = @{
        hostname = $env:COMPUTERNAME
        interfaces = @()
        ipconfig = @{
            adapters = @()
        }
    }
    user = @{
        username = $env:USERNAME
        domain = $env:USERDOMAIN
        homedir = $env:USERPROFILE
    }
    status = @{
        uptime = "Unknown"
        lastBoot = "Unknown"
        currentTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        platform = "win32"
        nodeVersion = "PowerShell"
        collectedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
}

try {
    # Computer Information
    $computerSystem = Get-WmiObject -Class Win32_ComputerSystem -ErrorAction SilentlyContinue
    $biosInfo = Get-WmiObject -Class Win32_BIOS -ErrorAction SilentlyContinue
    
    if ($computerSystem) {
        $result.computer.manufacturer = $computerSystem.Manufacturer
        $result.computer.model = $computerSystem.Model
    }
    
    if ($biosInfo) {
        $result.computer.serialNumber = $biosInfo.SerialNumber
    }
    
    # Operating System Information
    $osInfo = Get-WmiObject -Class Win32_OperatingSystem -ErrorAction SilentlyContinue
    if ($osInfo) {
        $result.operatingSystem.name = $osInfo.Caption
        $result.operatingSystem.version = $osInfo.Version
        $result.operatingSystem.architecture = $osInfo.OSArchitecture
        
        # Calculate uptime
        $bootTime = $osInfo.ConvertToDateTime($osInfo.LastBootUpTime)
        $uptime = (Get-Date) - $bootTime
        $result.status.lastBoot = $bootTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        $result.status.uptime = "$($uptime.Days) days, $($uptime.Hours) hours, $($uptime.Minutes) minutes"
    }
    
    # Processor Information
    $processor = Get-WmiObject -Class Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($processor) {
        $result.hardware.processor.name = $processor.Name
        $result.hardware.processor.cores = $processor.NumberOfCores
        $result.hardware.processor.maxSpeed = "$($processor.MaxClockSpeed) MHz"
    }
    
    # Memory Information
    $physicalMemory = Get-WmiObject -Class Win32_PhysicalMemory -ErrorAction SilentlyContinue
    $memorySlots = Get-WmiObject -Class Win32_PhysicalMemoryArray -ErrorAction SilentlyContinue
    
    # Calculate total memory
    $totalMemoryBytes = 0
    $memoryModules = @()
    
    if ($physicalMemory) {
        if ($physicalMemory -is [array]) {
            foreach ($module in $physicalMemory) {
                $totalMemoryBytes += $module.Capacity
                $memoryModules += @{
                    location = $module.DeviceLocator
                    capacity = [math]::Round($module.Capacity / 1GB, 2)
                    speed = "$($module.Speed) MHz"
                    manufacturer = $module.Manufacturer
                }
            }
            $result.hardware.memory.slots.used = $physicalMemory.Count
        } else {
            $totalMemoryBytes = $physicalMemory.Capacity
            $memoryModules += @{
                location = $physicalMemory.DeviceLocator
                capacity = [math]::Round($physicalMemory.Capacity / 1GB, 2)
                speed = "$($physicalMemory.Speed) MHz"
                manufacturer = $physicalMemory.Manufacturer
            }
            $result.hardware.memory.slots.used = 1
        }
    }
    
    # Calculate memory slots
    if ($memorySlots) {
        if ($memorySlots -is [array]) {
            $totalSlots = 0
            foreach ($slot in $memorySlots) {
                $totalSlots += $slot.MemoryDevices
            }
            $result.hardware.memory.slots.total = $totalSlots
        } else {
            $result.hardware.memory.slots.total = $memorySlots.MemoryDevices
        }
    } else {
        $result.hardware.memory.slots.total = $result.hardware.memory.slots.used
    }
    
    $result.hardware.memory.totalBytes = $totalMemoryBytes
    $result.hardware.memory.total = "$([math]::Round($totalMemoryBytes / 1GB, 1)) GB"
    $result.hardware.memory.slots.details = $memoryModules
    
    # Graphics Information
    $graphicsCards = Get-WmiObject -Class Win32_VideoController -ErrorAction SilentlyContinue
    $gpuList = @()
    
    if ($graphicsCards) {
        $realGPUs = $graphicsCards | Where-Object {
            $_.Name -notlike "*Microsoft*Basic*Display*" -and
            $_.Name -notlike "*Microsoft*Remote*Display*" -and
            $_.Name -notlike "*MS Idd*"
        }
        
        if (-not $realGPUs) { $realGPUs = $graphicsCards }
        
        foreach ($gpu in $realGPUs) {
            $vramMB = if($gpu.AdapterRAM -gt 0) { [math]::Round($gpu.AdapterRAM / 1MB, 0) } else { 0 }
            $vramText = if($vramMB -gt 0) { "$vramMB MB" } else { "Shared" }
            
            $gpuList += @{
                name = $gpu.Name
                memory = $vramText
                driverVersion = $gpu.DriverVersion
                videoProcessor = $gpu.VideoProcessor
            }
        }
    }
    
    $result.hardware.gpu = $gpuList
    
    # Storage Information
    $diskDrives = Get-WmiObject -Class Win32_DiskDrive -ErrorAction SilentlyContinue
    $logicalDisks = Get-WmiObject -Class Win32_LogicalDisk -ErrorAction SilentlyContinue
    $driveList = @()
    
    if ($logicalDisks) {
        foreach ($drive in $logicalDisks | Where-Object { $_.DriveType -eq 3 }) {
            $totalGB = [math]::Round($drive.Size / 1GB, 1)
            $freeGB = [math]::Round($drive.FreeSpace / 1GB, 1)
            $usedGB = $totalGB - $freeGB
            $usagePercent = if ($totalGB -gt 0) { [math]::Round(($usedGB / $totalGB) * 100, 0) } else { 0 }
            
            $driveList += @{
                drive = $drive.DeviceID
                total = "$totalGB GB"
                free = "$freeGB GB"
                used = "$usedGB GB"
                usagePercent = $usagePercent
                type = "Local Disk"
                label = $drive.VolumeName
            }
        }
    }
    
    $result.hardware.storage.drives = $driveList
    
    # Network Information
    $networkAdapters = Get-WmiObject -Class Win32_NetworkAdapter -ErrorAction SilentlyContinue | Where-Object { 
        $_.PhysicalAdapter -eq $true -and $_.NetConnectionStatus -eq 2 
    }
    $networkList = @()
    
    if ($networkAdapters) {
        foreach ($adapter in $networkAdapters) {
            $adapterConfig = Get-WmiObject -Class Win32_NetworkAdapterConfiguration -Filter "Index=$($adapter.DeviceID)" -ErrorAction SilentlyContinue
            
            if ($adapterConfig -and $adapterConfig.IPAddress) {
                $networkList += @{
                    name = $adapter.Name
                    address = $adapterConfig.IPAddress[0]
                    netmask = if($adapterConfig.IPSubnet) { $adapterConfig.IPSubnet[0] } else { "Unknown" }
                    mac = $adapterConfig.MACAddress
                    family = "IPv4"
                    gateway = if($adapterConfig.DefaultIPGateway) { $adapterConfig.DefaultIPGateway[0] } else { $null }
                    dhcp = $adapterConfig.DHCPEnabled
                }
            }
        }
    }
    
    $result.network.interfaces = $networkList
    
    # IPConfig Information
    try {
        $ipconfigOutput = & ipconfig /all 2>$null
        $currentAdapter = $null
        $adapters = @()
        
        foreach ($line in $ipconfigOutput) {
            $line = $line.Trim()
            
            if ($line -match "^(.+) adapter (.+):$") {
                if ($currentAdapter) {
                    $adapters += $currentAdapter
                }
                $currentAdapter = @{
                    name = $matches[2]
                    type = $matches[1]
                    details = @()
                }
            }
            elseif ($currentAdapter -and $line -match "^\s*(.+?)\s*\.\s*\.\s*\.\s*:\s*(.+)$") {
                $currentAdapter.details += @{
                    property = $matches[1].Trim()
                    value = $matches[2].Trim()
                }
            }
        }
        
        if ($currentAdapter) {
            $adapters += $currentAdapter
        }
        
        $result.network.ipconfig.adapters = $adapters
    }
    catch {
        # IPConfig failed, skip
    }
    
} catch {
    # Main collection failed, return what we have
}

# Convert to JSON and output
$result | ConvertTo-Json -Depth 10