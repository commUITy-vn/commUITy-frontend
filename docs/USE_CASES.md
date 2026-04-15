# CommUITy - Platform Use Cases and Actors

## I. ACTORS
- **Guest** (chưa đăng nhập)
- **Requester**
- **Volunteer**
- **Collaborator**
- **Admin**

## II. USE CASE CHO GUEST
- Đăng ký tài khoản
- Đăng nhập
- Xem danh sách bài hỗ trợ (giới hạn)
- Xem chi tiết SupportRequest
- Xem bài viết cộng đồng

## III. USE CASE CHUNG CHO USER (ĐÃ ĐĂNG NHẬP)
*Áp dụng cho: Requester, Volunteer, Collaborator, Admin*
- **Quản lý tài khoản**: Cập nhật hồ sơ cá nhân, Đổi mật khẩu, Đăng xuất, Làm mới phiên đăng nhập (refresh token)
- **Tương tác**: Nhắn tin người dùng khác, Nhận thông báo, Xem thông báo
- **Mạng xã hội**: Tạo Post, Chỉnh sửa Post (của mình), Xóa Post (của mình), Bình luận Post, Thả reaction
- **Bản đồ**: Xem SupportRequest trên bản đồ, Xem SupportLocation trên bản đồ, Xem khoảng cách, Xem đường đi (demo)
- **Tài chính cơ bản**: Donate tiền cho: SupportRequest, SupportLocation, CommunityFund; Xem lịch sử donation của mình

## IV. USE CASE CHO REQUESTER
- **Quản lý SupportRequest**: Tạo yêu cầu hỗ trợ, Chỉnh sửa yêu cầu (khi chưa được duyệt), Xóa yêu cầu (khi chưa được duyệt), Xem trạng thái yêu cầu, Đóng yêu cầu khi đã đủ hỗ trợ, Xem danh sách volunteer tham gia
- **Quản lý SupportItem**: Thêm nhu cầu hàng hóa, Cập nhật số lượng cần, Xem số lượng đã nhận
- **Tài chính riêng**: Xem tổng số tiền đã được ủng hộ, Xem danh sách donation cho SupportRequest của mình

## V. USE CASE CHO VOLUNTEER
- **Tìm kiếm và lọc**: Xem danh sách SupportRequest, Lọc theo: Lĩnh vực, Vị trí, Trạng thái
- **Tham gia hỗ trợ**: Nhận hỗ trợ (Tôi muốn giúp), Hủy hỗ trợ, Cập nhật trạng thái hoàn thành
- **Hỗ trợ hàng hóa**: Ghi nhận đóng góp (SupportItemContribution)
- **Nâng cấp vai trò**: Gửi yêu cầu trở thành Collaborator

## VI. USE CASE CHO COLLABORATOR
- **Xác minh SupportRequest**: Xem SupportRequest trong khu vực, Đề xuất duyệt / từ chối, Gắn SupportRequest vào SupportLocation
- **Quản lý SupportLocation**: Tạo SupportLocation, Cập nhật thông tin địa điểm, Thêm SupportItem cho location, Ghi nhận hàng hóa nhận vào
- **Quản lý tài chính tại location**: Xem thu/chi của SupportLocation, Tạo Expense từ SupportLocation

## VII. USE CASE CHO ADMIN
- **Quản lý người dùng**: Khóa / mở tài khoản, Promote Volunteer lên Collaborator, Phân quyền
- **Duyệt nội dung**: Duyệt SupportRequest, Từ chối SupportRequest, Xử lý Report
- **Quản lý CommunityFund**: Tạo CommunityFund, Xem sao kê quỹ, Tạo Expense từ CommunityFund
- **Thống kê**: Tổng số SupportRequest, Số đã hoàn thành, Tổng tiền quyên góp, Thống kê theo category

---
*Reference IDs format (1.1 -> 1.12)*
- 1.1 Authentication & Account Management
- 1.2 Communication & Notification
- 1.3 Social Interaction
- 1.4 Map & Location Services
- 1.5 Donation Management
- 1.6 Support Request Management
- 1.7 Support Item Management
- 1.8 Volunteer Participation
- 1.9 Support Location Management
- 1.10 Financial Management
- 1.11 Administration & Moderation
- 1.12 System Statistics
