using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PayamBack.Data;
using PayamBack.DTOs.Schedule.ElmiTerm;
using PayamBack.Models.Core;
using PayamBack.Models.Identity;
using PayamBack.Models.Schedule;
using System.Security.Claims;

namespace PayamBack.Controllers.Schedule
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ElmiTermController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<AppRole> _roleManager;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public ElmiTermController(
            AppDbContext context,
            UserManager<AppUser> userManager,
            RoleManager<AppRole> roleManager,
            IWebHostEnvironment webHostEnvironment)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _webHostEnvironment = webHostEnvironment;
        }

        // ============================================================
        // 🔥 متدهای کمکی
        // ============================================================

        private async Task<(AppUser? user, AppRole? role, Markaz? markaz, int? codeRole)> GetCurrentUserInfoAsync()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return (null, null, null, null);

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return (null, null, null, null);

            var roleName = User.FindFirst(ClaimTypes.Role)?.Value;
            if (string.IsNullOrEmpty(roleName))
                return (user, null, null, null);

            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null)
                return (user, null, null, null);

            var activeRole = await _context.Set<AppUserRole>()
                .FirstOrDefaultAsync(ur => ur.UserId == user.Id && ur.RoleId == role.Id && ur.RolePishFarz==true);

            Markaz? markaz = null;
            if (activeRole?.MarkazId != null)
            {
                markaz = await _context.Markazes.FindAsync(activeRole.MarkazId.Value);
            }

            return (user, role, markaz, role.CodeRole);
        }

        private async Task<bool> IsOstadUserAsync(int userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            return user?.OstadId != null;
        }

        private async Task<bool> CanAccessTargetUserAsync(int targetUserId, int codeRole, int? currentMarkazId)
        {
            if (codeRole == 1) return true;

            var targetUser = await _userManager.Users
                .Include(u => u.Ostad)
                .FirstOrDefaultAsync(u => u.Id == targetUserId);

            if (targetUser == null) return false;

            if (targetUserId == int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0"))
            {
                var isOstad = await IsOstadUserAsync(targetUserId);
                if (isOstad) return true;
            }

            if (targetUser.Ostad?.MarkazId != null)
            {
                return await CanAccessTargetMarkazAsync(targetUser.Ostad.MarkazId.Value, codeRole, currentMarkazId);
            }

            return false;
        }

        private async Task<bool> CanAccessTargetMarkazAsync(int targetMarkazId, int codeRole, int? currentMarkazId)
        {
            if (codeRole == 1 || codeRole == 2) return true;

            var targetMarkaz = await _context.Markazes.FindAsync(targetMarkazId);
            if (targetMarkaz == null) return false;

            var currentMarkaz = await _context.Markazes.FindAsync(currentMarkazId);
            if (currentMarkaz == null) return false;

            if (codeRole == 3)
                return targetMarkaz.CodeOstan == currentMarkaz.CodeOstan;

            if (codeRole == 4)
                return targetMarkaz.Id == currentMarkaz.Id;

            return false;
        }

        private async Task<List<int>> GetAccessibleMarkazIdsAsync(int codeRole, int? currentMarkazId)
        {
            if (codeRole == 1 || codeRole == 2)
            {
                return await _context.Markazes
                    .Where(m => m.Vazeeyat == true)
                    .Select(m => m.Id)
                    .ToListAsync();
            }

            var currentMarkaz = await _context.Markazes.FindAsync(currentMarkazId);
            if (currentMarkaz == null) return new List<int>();

            if (codeRole == 3)
            {
                return await _context.Markazes
                    .Where(m => m.Vazeeyat == true && m.CodeOstan == currentMarkaz.CodeOstan)
                    .Select(m => m.Id)
                    .ToListAsync();
            }

            if (codeRole == 4)
            {
                return new List<int> { currentMarkaz.Id };
            }

            return new List<int>();
        }

        private static string GetOstadName(AppUser? user)
        {
            if (user?.Ostad == null) return "";
            return $"{user.Ostad.Naam} {user.Ostad.NaamKhanevadegi}".Trim();
        }

        private static string GetOstadCode(AppUser? user)
        {
            return user?.Ostad?.CodeOstadi ?? "";
        }

        private static string GetOstadMarkaz(AppUser? user)
        {
            return user?.Ostad?.Markaz?.NaamMarkaz ?? "";
        }

        private static string GetApproveStatusDisplay(int? status)
        {
            return status switch
            {
                0 => "در انتظار بررسی",
                1 => "تایید شده",
                2 => "رد شده",
                _ => "نامشخص"
            };
        }

        private async Task<string> SaveFileAsync(IFormFile file, int id)
        {
            var uploadFolder = Path.Combine(_webHostEnvironment.WebRootPath ?? "wwwroot", "uploads", "elmi-term");
            if (!Directory.Exists(uploadFolder))
                Directory.CreateDirectory(uploadFolder);

            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            var fileName = $"{id}_{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/elmi-term/{fileName}";
        }

        private void DeleteFile(string? filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;

            var physicalPath = Path.Combine(_webHostEnvironment.WebRootPath ?? "wwwroot", filePath.TrimStart('/'));
            if (System.IO.File.Exists(physicalPath))
            {
                System.IO.File.Delete(physicalPath);
            }
        }

        // ============================================================
        // 1️⃣ دریافت لیست درخواست‌ها
        // ============================================================
        [HttpGet("list")]
        public async Task<IActionResult> GetList(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? termCode = null,
            [FromQuery] int? approveStatus = null,
            [FromQuery] int? ostanId = null,
            [FromQuery] int? markazId = null)
        {
            try
            {
                var (currentUser, currentRole, currentMarkaz, codeRole) = await GetCurrentUserInfoAsync();
                if (currentUser == null || codeRole == null)
                    return Unauthorized(new { success = false, message = "کاربر یا نقش معتبر نیست" });

                if (string.IsNullOrEmpty(termCode))
                {
                    return BadRequest(new { success = false, message = "کد ترم الزامی است" });
                }

                var accessibleMarkazIds = await GetAccessibleMarkazIdsAsync(codeRole.Value, currentMarkaz?.Id);

                var query = from e in _context.Set<ElmiTerm>()
                            join u in _context.Users on e.UserId equals u.Id into userJoin
                            from u in userJoin.DefaultIfEmpty()
                            join o in _context.Ostads on u.OstadId equals o.Id into ostadJoin
                            from o in ostadJoin.DefaultIfEmpty()
                            join au in _context.Users on e.ApprovedByUserId equals au.Id into approvedJoin
                            from au in approvedJoin.DefaultIfEmpty()
                            select new { ElmiTerm = e, User = u, Ostad = o, ApprovedUser = au };

                query = query.Where(x => x.ElmiTerm.TermCode == termCode);

                //var isOstad = currentUser.OstadId.HasValue;
                var isOstad = currentRole?.Name == "استاد";

                if (isOstad)
                {
                    query = query.Where(x => x.ElmiTerm.UserId == currentUser.Id);
                }
                else if (codeRole == 3 && currentMarkaz != null)
                {
                    var markazIdsInOstan = await _context.Markazes
                        .Where(m => m.CodeOstan == currentMarkaz.CodeOstan)
                        .Select(m => m.Id)
                        .ToListAsync();

                    query = query.Where(x =>
                        x.Ostad != null &&
                        x.Ostad.MarkazId.HasValue &&
                        markazIdsInOstan.Contains(x.Ostad.MarkazId.Value));
                }
                else if (codeRole == 4 && currentMarkaz != null)
                {
                    query = query.Where(x =>
                        x.Ostad != null &&
                        x.Ostad.MarkazId == currentMarkaz.Id);
                }

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(x =>
                        (x.Ostad != null && x.Ostad.Naam != null && x.Ostad.Naam.Contains(search)) ||
                        (x.Ostad != null && x.Ostad.NaamKhanevadegi != null && x.Ostad.NaamKhanevadegi.Contains(search)) ||
                        (x.Ostad != null && x.Ostad.CodeOstadi != null && x.Ostad.CodeOstadi.Contains(search)));
                }

                if (approveStatus.HasValue)
                {
                    query = query.Where(x => x.ElmiTerm.ApproveStatus == approveStatus.Value);
                }

                if (ostanId.HasValue && !markazId.HasValue && !isOstad)
                {
                    var markazIdsInOstan = await _context.Markazes
                        .Where(m => m.CodeOstan == ostanId.Value.ToString() && m.Vazeeyat == true)
                        .Select(m => m.Id)
                        .ToListAsync();

                    query = query.Where(x =>
                        x.Ostad != null &&
                        x.Ostad.MarkazId.HasValue &&
                        markazIdsInOstan.Contains(x.Ostad.MarkazId.Value));
                }
                else if (ostanId.HasValue && markazId.HasValue && !isOstad)
                {
                    query = query.Where(x =>
                        x.Ostad != null &&
                        x.Ostad.MarkazId == markazId.Value);
                }

                var totalCount = await query.CountAsync();

                var items = await query
                    .OrderByDescending(x => x.ElmiTerm.Id)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(x => new ElmiTermListDto
                    {
                        Id = x.ElmiTerm.Id,
                        UserId = x.ElmiTerm.UserId,
                        OstadName = x.Ostad != null ? $"{x.Ostad.Naam} {x.Ostad.NaamKhanevadegi}" : "",
                        OstadCode = x.Ostad != null ? x.Ostad.CodeOstadi ?? "" : "",
                        OstadMarkaz = x.Ostad != null && x.Ostad.MarkazId != null ?
                            _context.Markazes.Where(m => m.Id == x.Ostad.MarkazId).Select(m => m.NaamMarkaz ?? "").FirstOrDefault() ?? "" : "",
                        TermCode = x.ElmiTerm.TermCode ?? "",
                        AkharinVazeeat = x.ElmiTerm.AkharinVazeeat ?? "",
                        IsEjeari = x.ElmiTerm.IsEjeari ?? false,
                        OnvanEjraei = x.ElmiTerm.OnvanEjraei ?? "",
                        FullTime = x.ElmiTerm.FullTime ?? false,
                        TedadSaatMovazafi = x.ElmiTerm.TedadSaatMovazafi ?? "",
                        ApproveStatus = x.ElmiTerm.ApproveStatus ?? 0,
                        ApproveStatusDisplay = GetApproveStatusDisplay(x.ElmiTerm.ApproveStatus),
                        ApprovedBy = x.ApprovedUser != null ? GetOstadName(x.ApprovedUser) : "",
                        FilePath = x.ElmiTerm.FilePath ?? "",
                        HasFile = !string.IsNullOrEmpty(x.ElmiTerm.FilePath),
                        CreatedAt = DateTime.Now
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    message = "لیست درخواست‌ها دریافت شد",
                    data = items,
                    pagination = new
                    {
                        page,
                        pageSize,
                        totalCount,
                        totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطا در دریافت لیست",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // 2️⃣ دریافت یک درخواست
        // ============================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var item = await _context.Set<ElmiTerm>()
                    .Include(e => e.User)
                        .ThenInclude(u => u.Ostad)
                            .ThenInclude(o => o.Markaz)
                    .Include(e => e.ApprovedByUser)
                        .ThenInclude(u => u.Ostad)
                    .Include(e => e.UserSabtKonandeh)
                    .Include(e => e.RoleSabtKonandeh)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (item == null)
                    return NotFound(new { success = false, message = "درخواست یافت نشد" });

                var (currentUser, currentRole, currentMarkaz, codeRole) = await GetCurrentUserInfoAsync();
                if (currentUser == null || codeRole == null)
                    return Unauthorized(new { success = false, message = "کاربر یا نقش معتبر نیست" });

                var isOstad = currentRole?.Name == "استاد";
                if (isOstad && item.UserId != currentUser.Id)
                    return Forbid();

                if (!isOstad && item.UserId.HasValue)
                {
                    if (!await CanAccessTargetUserAsync(item.UserId.Value, codeRole.Value, currentMarkaz?.Id))
                        return Forbid();
                }

                var dto = new ElmiTermDetailDto
                {
                    Id = item.Id,
                    UserId = item.UserId,
                    OstadName = GetOstadName(item.User),
                    OstadCode = GetOstadCode(item.User),
                    OstadMarkaz = GetOstadMarkaz(item.User),
                    TermCode = item.TermCode ?? "",
                    AkharinVazeeat = item.AkharinVazeeat ?? "",
                    IsEjeari = item.IsEjeari ?? false,
                    OnvanEjraei = item.OnvanEjraei ?? "",
                    FullTime = item.FullTime ?? false,
                    TedadSaatMovazafi = item.TedadSaatMovazafi ?? "",
                    ApproveStatus = item.ApproveStatus ?? 0,
                    ApproveStatusDisplay = GetApproveStatusDisplay(item.ApproveStatus),
                    ApprovedByUserName = item.ApprovedByUser != null
                        ? GetUserFullName(item.ApprovedByUser) : "",
                    ApprovedByRoleMarkaz = item.ApprovedByRoleMarkaz ?? "",
                    ApprovedAt = item.ApprovedAt,
                    ApproveTozihat = item.ApproveTozihat,
                    FilePath = item.FilePath,
                    FileName = Path.GetFileName(item.FilePath),
                    CreatedBy = item.UserSabtKonandeh != null
                        ? GetUserFullName(item.UserSabtKonandeh)
                        : "",
                    CreatedAt = DateTime.Now
                };

                return Ok(new
                {
                    success = true,
                    message = "اطلاعات درخواست دریافت شد",
                    data = dto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطا در دریافت اطلاعات",
                    error = ex.Message
                });
            }
        }
        // در ElmiTermController.cs
        private string GetUserFullName(AppUser? user)
        {
            if (user == null) return "";

            // اگر استاد است
            if (user.Ostad != null)
                return $"{user.Ostad.Naam} {user.Ostad.NaamKhanevadegi}".Trim();

            // اگر کارمند است
            if (user.Karmand != null)
                return $"{user.Karmand.Naam} {user.Karmand.NaameKhanevadeghi}".Trim();

            // اگر ادمین است
            if (user.MoshakhasatAdmin != null)
                return $"{user.MoshakhasatAdmin.Naam} {user.MoshakhasatAdmin.NaameKhanevadeghi}".Trim();

            // اگر دانشجو است
            if (user.Daneshjoo != null)
                return $"{user.Daneshjoo.Naam} {user.Daneshjoo.NaamKhanevadegi}".Trim();

            // در غیر این صورت، نام کاربری را برگردان
            return user.UserName ?? "";
        }
        // ============================================================
        // 3️⃣ ایجاد درخواست جدید
        // ============================================================
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromForm] ElmiTermCreateDto dto)
        {
            try
            {
                var (currentUser, currentRole, currentMarkaz, codeRole) = await GetCurrentUserInfoAsync();
                if (currentUser == null || codeRole == null)
                    return Unauthorized(new { success = false, message = "کاربر یا نقش معتبر نیست" });

                var isOstad = currentUser.OstadId.HasValue;

                if (isOstad && dto.UserId != currentUser.Id)
                    return BadRequest(new { success = false, message = "شما فقط می‌توانید درخواست خود را ثبت کنید" });

                if (!isOstad)
                {
                    if (!await CanAccessTargetUserAsync(dto.UserId, codeRole.Value, currentMarkaz?.Id))
                        return Forbid();
                }
                // ============================================================
                // 🔥 بررسی: فقط ترم جاری قابل ثبت است
                // ============================================================
                var currentTerm = await _context.Terms.FirstOrDefaultAsync(t => t.Vazeeyat == true);
                if (currentTerm == null)
                    return BadRequest(new { success = false, message = "ترم جاری در سیستم تعریف نشده است" });

                if (dto.TermCode != currentTerm.CodeTerm)
                    return BadRequest(new { success = false, message = "ثبت درخواست جدید فقط برای ترم جاری امکان‌پذیر است" });

                var termExists = await _context.Terms.AnyAsync(t => t.CodeTerm == dto.TermCode);
                if (!termExists)
                    return BadRequest(new { success = false, message = "ترم وارد شده معتبر نیست" });

                var exists = await _context.Set<ElmiTerm>()
                    .AnyAsync(e => e.UserId == dto.UserId && e.TermCode == dto.TermCode);

                if (exists)
                    return BadRequest(new { success = false, message = "درخواستی برای این استاد در این ترم قبلاً ثبت شده است" });

                // ============================================================
                // کپی از ترم قبل
                // ============================================================
                if (dto.CopyFromId.HasValue)
                {
                    var source = await _context.Set<ElmiTerm>()
                        .FirstOrDefaultAsync(e => e.Id == dto.CopyFromId.Value && e.UserId == dto.UserId);

                    if (source != null)
                    {
                        var entity = new ElmiTerm
                        {
                            UserId = dto.UserId,
                            TermCode = dto.TermCode,
                            UserIdSabtKonandeh = currentUser.Id,
                            RoleIdSabtKonandeh = currentRole.Id,
                            AkharinVazeeat = source.AkharinVazeeat,
                            IsEjeari = source.IsEjeari,
                            OnvanEjraei = source.OnvanEjraei,
                            FullTime = source.FullTime,
                            TedadSaatMovazafi = source.TedadSaatMovazafi,
                            ApproveStatus = 0
                        };

                        await _context.Set<ElmiTerm>().AddAsync(entity);
                        await _context.SaveChangesAsync();

                        if (!string.IsNullOrEmpty(source.FilePath))
                        {
                            var sourcePath = Path.Combine(_webHostEnvironment.WebRootPath ?? "wwwroot", source.FilePath.TrimStart('/'));
                            if (System.IO.File.Exists(sourcePath))
                            {
                                var fileExtension = Path.GetExtension(sourcePath);
                                var newFileName = $"{entity.Id}_{Guid.NewGuid()}{fileExtension}";
                                var newFilePath = Path.Combine(_webHostEnvironment.WebRootPath ?? "wwwroot", "uploads", "elmi-term", newFileName);

                                System.IO.File.Copy(sourcePath, newFilePath);
                                entity.FilePath = $"/uploads/elmi-term/{newFileName}";
                                await _context.SaveChangesAsync();
                            }
                        }

                        return Ok(new
                        {
                            success = true,
                            message = "درخواست با موفقیت از ترم قبل کپی شد",
                            data = new { id = entity.Id }
                        });
                    }
                }

                // ============================================================
                // ثبت درخواست جدید
                // ============================================================
                var newEntity = new ElmiTerm
                {
                    UserId = dto.UserId,
                    TermCode = dto.TermCode,
                    UserIdSabtKonandeh = currentUser.Id,
                    RoleIdSabtKonandeh = currentRole.Id,
                    AkharinVazeeat = dto.AkharinVazeeat,
                    IsEjeari = dto.IsEjeari,
                    OnvanEjraei = dto.OnvanEjraei,
                    FullTime = dto.FullTime,
                    TedadSaatMovazafi = dto.TedadSaatMovazafi,
                    ApproveStatus = 0
                };

                await _context.Set<ElmiTerm>().AddAsync(newEntity);
                await _context.SaveChangesAsync();

                if (dto.File != null)
                {
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
                    var fileExtension = Path.GetExtension(dto.File.FileName).ToLower();
                    if (!allowedExtensions.Contains(fileExtension))
                        return BadRequest(new { success = false, message = "فرمت فایل مجاز نیست. فقط JPG, PNG, PDF مجاز است" });

                    if (dto.File.Length > 2 * 1024 * 1024)
                        return BadRequest(new { success = false, message = "حجم فایل نباید بیشتر از ۲ مگابایت باشد" });

                    newEntity.FilePath = await SaveFileAsync(dto.File, newEntity.Id);
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    success = true,
                    message = "درخواست با موفقیت ثبت شد",
                    data = new { id = newEntity.Id }
                });
            }
            catch (Exception ex)
            {
                // 🔥 لاگ کامل خطا
                var innerMessage = ex.InnerException?.Message ?? "No inner exception";
                var innerStackTrace = ex.InnerException?.StackTrace ?? "No stack trace";

                Console.WriteLine($"=== DbUpdateException ===");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Inner Exception: {innerMessage}");
                Console.WriteLine($"Stack Trace: {innerStackTrace}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطا در ثبت درخواست",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // 4️⃣ کپی درخواست از ترم قبل (متد مجزا)
        // ============================================================
        [HttpPost("copy")]
        public async Task<IActionResult> CopyFromPreviousTerm([FromBody] ElmiTermCopyDto dto)
        {
            try
            {
                var (currentUser, currentRole, currentMarkaz, codeRole) = await GetCurrentUserInfoAsync();
                if (currentUser == null || codeRole == null)
                    return Unauthorized(new { success = false, message = "کاربر یا نقش معتبر نیست" });

                var isOstad = currentUser.OstadId.HasValue;
                if (isOstad && dto.UserId != currentUser.Id)
                    return BadRequest(new { success = false, message = "شما فقط می‌توانید درخواست خود را کپی کنید" });

                if (!isOstad)
                {
                    if (!await CanAccessTargetUserAsync(dto.UserId, codeRole.Value, currentMarkaz?.Id))
                        return Forbid();
                }

                var termExists = await _context.Terms.AnyAsync(t => t.CodeTerm == dto.TargetTermCode);
                if (!termExists)
                    return BadRequest(new { success = false, message = "ترم مقصد معتبر نیست" });

                var exists = await _context.Set<ElmiTerm>()
                    .AnyAsync(e => e.UserId == dto.UserId && e.TermCode == dto.TargetTermCode);

                if (exists)
                    return BadRequest(new { success = false, message = "درخواستی برای این استاد در ترم مقصد قبلاً ثبت شده است" });

                var source = await _context.Set<ElmiTerm>()
                    .FirstOrDefaultAsync(e => e.UserId == dto.UserId && e.TermCode == dto.SourceTermCode);

                if (source == null)
                    return NotFound(new { success = false, message = "درخواستی در ترم منبع یافت نشد" });

                var newEntity = new ElmiTerm
                {
                    UserId = dto.UserId,
                    TermCode = dto.TargetTermCode,
                    UserIdSabtKonandeh = currentUser.Id,
                    RoleIdSabtKonandeh = currentRole.Id,
                    AkharinVazeeat = source.AkharinVazeeat,
                    IsEjeari = source.IsEjeari,
                    OnvanEjraei = source.OnvanEjraei,
                    FullTime = source.FullTime,
                    TedadSaatMovazafi = source.TedadSaatMovazafi,
                    ApproveStatus = 0
                };

                await _context.Set<ElmiTerm>().AddAsync(newEntity);
                await _context.SaveChangesAsync();

                if (!string.IsNullOrEmpty(source.FilePath))
                {
                    var sourcePath = Path.Combine(_webHostEnvironment.WebRootPath ?? "wwwroot", source.FilePath.TrimStart('/'));
                    if (System.IO.File.Exists(sourcePath))
                    {
                        var fileExtension = Path.GetExtension(sourcePath);
                        var newFileName = $"{newEntity.Id}_{Guid.NewGuid()}{fileExtension}";
                        var newFilePath = Path.Combine(_webHostEnvironment.WebRootPath ?? "wwwroot", "uploads", "elmi-term", newFileName);

                        System.IO.File.Copy(sourcePath, newFilePath);
                        newEntity.FilePath = $"/uploads/elmi-term/{newFileName}";
                        await _context.SaveChangesAsync();
                    }
                }

                return Ok(new
                {
                    success = true,
                    message = "درخواست با موفقیت از ترم قبل کپی شد",
                    data = new { id = newEntity.Id }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطا در کپی درخواست",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // 5️⃣ ویرایش درخواست
        // ============================================================
        [HttpPut("update")]
        public async Task<IActionResult> Update([FromForm] ElmiTermUpdateDto dto)
        {
            try
            {
                var (currentUser, currentRole, currentMarkaz, codeRole) = await GetCurrentUserInfoAsync();
                if (currentUser == null || codeRole == null)
                    return Unauthorized(new { success = false, message = "کاربر یا نقش معتبر نیست" });

                var entity = await _context.Set<ElmiTerm>()
                    .FirstOrDefaultAsync(e => e.Id == dto.Id);

                if (entity == null)
                    return NotFound(new { success = false, message = "درخواست یافت نشد" });

                var isOstad = currentUser.OstadId.HasValue;
                if (isOstad && entity.UserId != currentUser.Id)
                    return Forbid();

                if (!isOstad && entity.UserId.HasValue)
                {
                    if (!await CanAccessTargetUserAsync(entity.UserId.Value, codeRole.Value, currentMarkaz?.Id))
                        return Forbid();
                }

                if (entity.ApproveStatus != 0)
                    return BadRequest(new { success = false, message = "درخواست بررسی شده و قابل ویرایش نیست" });

                if (!string.IsNullOrEmpty(dto.AkharinVazeeat)) entity.AkharinVazeeat = dto.AkharinVazeeat;
                if (dto.IsEjeari.HasValue) entity.IsEjeari = dto.IsEjeari;
                if (!string.IsNullOrEmpty(dto.OnvanEjraei)) entity.OnvanEjraei = dto.OnvanEjraei;
                if (dto.FullTime.HasValue) entity.FullTime = dto.FullTime;
                if (!string.IsNullOrEmpty(dto.TedadSaatMovazafi)) entity.TedadSaatMovazafi = dto.TedadSaatMovazafi;

                if (dto.File != null)
                {
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
                    var fileExtension = Path.GetExtension(dto.File.FileName).ToLower();
                    if (!allowedExtensions.Contains(fileExtension))
                        return BadRequest(new { success = false, message = "فرمت فایل مجاز نیست. فقط JPG, PNG, PDF مجاز است" });

                    if (dto.File.Length > 2 * 1024 * 1024)
                        return BadRequest(new { success = false, message = "حجم فایل نباید بیشتر از ۲ مگابایت باشد" });

                    if (!string.IsNullOrEmpty(entity.FilePath))
                    {
                        DeleteFile(entity.FilePath);
                    }

                    entity.FilePath = await SaveFileAsync(dto.File, entity.Id);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "درخواست با موفقیت ویرایش شد"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطا در ویرایش درخواست",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // 6️⃣ تایید/رد درخواست
        // ============================================================
        [HttpPatch("approve")]
        public async Task<IActionResult> Approve([FromBody] ElmiTermApproveDto dto)
        {
            try
            {
                var (currentUser, currentRole, currentMarkaz, codeRole) = await GetCurrentUserInfoAsync();
                if (currentUser == null || codeRole == null)
                    return Unauthorized(new { success = false, message = "کاربر یا نقش معتبر نیست" });

                var entity = await _context.Set<ElmiTerm>()
                    .FirstOrDefaultAsync(e => e.Id == dto.Id);

                if (entity == null)
                    return NotFound(new { success = false, message = "درخواست یافت نشد" });

                if (entity.UserId.HasValue)
                {
                    if (!await CanAccessTargetUserAsync(entity.UserId.Value, codeRole.Value, currentMarkaz?.Id))
                        return Forbid();
                }

                if (entity.ApproveStatus != 0)
                    return BadRequest(new { success = false, message = "این درخواست قبلاً بررسی شده است" });
                
                var roleName = currentRole?.Name ?? "نقش نامشخص";
                var markazName = currentMarkaz?.NaamMarkaz ?? "مرکز نامشخص";

                // اگر مرکز سطح 3 باشد (استان)، نام استان را نشان بده
                if (currentMarkaz?.Level == 3)
                {
                    markazName = $"استان {currentMarkaz.NaamOstan ?? ""}";
                }
                else if (currentMarkaz?.Level == 2)
                {
                    markazName = "سازمان مرکزی";
                }

                var roleMarkaz = $"{roleName} - {markazName}";

                entity.ApproveStatus = dto.ApproveStatus;
                entity.ApprovedByUserId = currentUser.Id;
                entity.ApprovedByRoleMarkaz = roleMarkaz;
                entity.ApprovedAt = DateTime.Now;
                entity.ApproveTozihat = dto.Tozihat;

                await _context.SaveChangesAsync();

                var statusText = dto.ApproveStatus == 1 ? "تایید" : "رد";

                return Ok(new
                {
                    success = true,
                    message = $"درخواست با موفقیت {statusText} شد"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطا در تایید/رد درخواست",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // 7️⃣ حذف درخواست (همراه با حذف فایل)
        // ============================================================
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var (currentUser, currentRole, currentMarkaz, codeRole) = await GetCurrentUserInfoAsync();
                if (currentUser == null || codeRole == null)
                    return Unauthorized(new { success = false, message = "کاربر یا نقش معتبر نیست" });

                var entity = await _context.Set<ElmiTerm>()
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (entity == null)
                    return NotFound(new { success = false, message = "درخواست یافت نشد" });

                if (codeRole != 1)
                {
                    if (entity.UserId != currentUser.Id)
                        return Forbid();
                }

                if (!string.IsNullOrEmpty(entity.FilePath))
                {
                    DeleteFile(entity.FilePath);
                }

                _context.Set<ElmiTerm>().Remove(entity);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "درخواست با موفقیت حذف شد"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطا در حذف درخواست",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // 8️⃣ دریافت درخواست بر اساس UserId و TermCode
        // ============================================================
        [HttpGet("by-user-term")]
        public async Task<IActionResult> GetByUserAndTerm(
            [FromQuery] int userId,
            [FromQuery] string termCode)
        {
            try
            {
                var (currentUser, currentRole, currentMarkaz, codeRole) = await GetCurrentUserInfoAsync();
                if (currentUser == null || codeRole == null)
                    return Unauthorized(new { success = false, message = "کاربر یا نقش معتبر نیست" });

                if (!await CanAccessTargetUserAsync(userId, codeRole.Value, currentMarkaz?.Id))
                    return Forbid();

                var entity = await _context.Set<ElmiTerm>()
                    .Include(e => e.User)
                        .ThenInclude(u => u.Ostad)
                            .ThenInclude(o => o.Markaz)
                    .FirstOrDefaultAsync(e => e.UserId == userId && e.TermCode == termCode);

                if (entity == null)
                    return NotFound(new { success = false, message = "درخواستی برای این استاد در این ترم یافت نشد" });

                var dto = new ElmiTermDetailDto
                {
                    Id = entity.Id,
                    UserId = entity.UserId,
                    OstadName = GetOstadName(entity.User),
                    OstadCode = GetOstadCode(entity.User),
                    OstadMarkaz = GetOstadMarkaz(entity.User),
                    TermCode = entity.TermCode ?? "",
                    AkharinVazeeat = entity.AkharinVazeeat ?? "",
                    IsEjeari = entity.IsEjeari ?? false,
                    OnvanEjraei = entity.OnvanEjraei ?? "",
                    FullTime = entity.FullTime ?? false,
                    TedadSaatMovazafi = entity.TedadSaatMovazafi ?? "",
                    ApproveStatus = entity.ApproveStatus ?? 0,
                    ApproveStatusDisplay = GetApproveStatusDisplay(entity.ApproveStatus),
                    ApprovedByUserName = entity.ApprovedByUser != null ? GetOstadName(entity.ApprovedByUser) : "",
                    ApprovedAt = entity.ApprovedAt,
                    ApproveTozihat = entity.ApproveTozihat,
                    FilePath = entity.FilePath,
                    FileName = Path.GetFileName(entity.FilePath),
                    CreatedAt = DateTime.Now
                };

                return Ok(new
                {
                    success = true,
                    message = "اطلاعات درخواست دریافت شد",
                    data = dto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطا در دریافت اطلاعات",
                    error = ex.Message
                });
            }
        }
        
        [HttpGet("download/{id}")]
        [Authorize]
        public async Task<IActionResult> DownloadFile(int id)
        {
            var entity = await _context.Set<ElmiTerm>()
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entity == null || string.IsNullOrEmpty(entity.FilePath))
                return NotFound(new { message = "فایل یافت نشد" });

            var filePath = Path.Combine(_webHostEnvironment.WebRootPath ?? "wwwroot", entity.FilePath.TrimStart('/'));
            if (!System.IO.File.Exists(filePath))
                return NotFound(new { message = "فایل در سرور یافت نشد" });

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            var fileName = Path.GetFileName(entity.FilePath);

            // تشخیص نوع فایل
            var contentType = "application/octet-stream";
            var extension = Path.GetExtension(fileName).ToLower();
            if (extension == ".pdf") contentType = "application/pdf";
            else if (extension == ".jpg" || extension == ".jpeg") contentType = "image/jpeg";
            else if (extension == ".png") contentType = "image/png";

            return File(fileBytes, contentType, fileName);
        }

        // ============================================================
        // بازگشت درخواست به حالت "در انتظار بررسی"
        // ============================================================
        [HttpPatch("reset-pending/{id}")]
        public async Task<IActionResult> ResetToPending(int id)
        {
            try
            {
                var (currentUser, currentRole, currentMarkaz, codeRole) = await GetCurrentUserInfoAsync();
                if (currentUser == null || codeRole == null)
                    return Unauthorized(new { success = false, message = "کاربر یا نقش معتبر نیست" });

                // ============================================================
                // 🔥 بررسی مجوز (با PermissionFilter)
                // ============================================================
                // نیازی به بررسی CodeRole نیست، PermissionFilter خودش مدیریت می‌کند
                // فقط مطمئن می‌شویم که کاربر به درخواست دسترسی دارد

                var entity = await _context.Set<ElmiTerm>()
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (entity == null)
                    return NotFound(new { success = false, message = "درخواست یافت نشد" });

                // ============================================================
                // 🔥 بررسی دسترسی به کاربر هدف (بر اساس مرکز)
                // ============================================================
                if (entity.UserId.HasValue)
                {
                    if (!await CanAccessTargetUserAsync(entity.UserId.Value, codeRole.Value, currentMarkaz?.Id))
                        return Forbid();
                }

                // ============================================================
                // 🔥 اگر قبلاً در حالت در انتظار است، نیازی به تغییر نیست
                // ============================================================
                if (entity.ApproveStatus == 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "این درخواست در حال حاضر در حالت در انتظار بررسی است"
                    });
                }

                // ============================================================
                // 🔥 بازگشت به حالت در انتظار بررسی
                // ============================================================
                entity.ApproveStatus = 0;
                entity.ApprovedByUserId = null;
                entity.ApprovedByRoleMarkaz = null;
                entity.ApprovedAt = null;
                entity.ApproveTozihat = null;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "درخواست با موفقیت به حالت در انتظار بررسی بازگشت"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطا در بازگشت به حالت در انتظار بررسی",
                    error = ex.Message
                });
            }
        }
    }
}