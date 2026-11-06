# Luật Cờ Gánh trên Cheslax

Nguồn đối chiếu: Wikipedia tiếng Việt (*Cờ gánh*), mô tả dân gian Đà Nẵng / Quảng Nam, và sơ đồ bàn Alquerque 5×5.

Luật server (`Cheslax.GameEngine.CoGanh`) khớp engine TypeScript trên frontend.

- Bàn 5×5 giao điểm; adjacency graph gồm mọi cạnh ngang/dọc và đường chéo Alquerque (điểm chẵn mới có chéo).
- Mỗi bên 8 quân trên vành: Đỏ `a1 b1 c1 d1 e1 a2 e2 a3`, Xanh đối xứng 180°.
- Đi một bước tới điểm trống liền kề theo cạnh. Gánh khi vừa đi vào giữa hai quân đối phương trên cùng một đường nối. Vây khi nhóm đối phương hết liberty.
- Thắng khi chiếm hết quân đối phương. Biến thể “bắt buộc phải Gánh” không được bật.
