# Cờ tướng — luật Cheslax

Cheslax uses standard Vietnamese Chinese Chess rules on a 9×10 intersection board.

- Red moves first. Pieces sit on intersections, not in the squares.
- The two palaces are 3×3. The river divides the board between ranks 4 and 5.
- **Tướng** moves one step orthogonally inside its palace. The two generals may not face each other on an open file.
- **Sĩ** moves one step diagonally inside its palace.
- **Tượng** moves two steps diagonally, cannot cross the river, and cannot jump a blocked eye.
- **Xe** slides any number of empty intersections orthogonally.
- **Pháo** slides like a chariot when not capturing, and captures by jumping exactly one screen.
- **Mã** moves in an L and is blocked by an occupied adjacent leg.
- **Tốt** moves one step forward; after crossing the river it may also move one step sideways. It never moves backward.
- A move that leaves the player's own general in check is illegal.
- The opposing general cannot be captured as an ordinary move. Check and checkmate are detected instead.
- Checkmate wins. Stalemate (困毙 — no legal move, not in check) is a **loss** for the side that cannot move.
- Repeating the same position three times is a draw. Perpetual-check and perpetual-chase losses used in Asian competition are not implemented.

Coordinates use ICCS squares `a0`–`i9` (red general starts on `e0`). History uses Vietnamese piece names, for example `Pháo h2xe9`.
