export function orByIdNo(id: any, field = 'emp_no') {
  const idStr = String(id);
  const or: any[] = [{ [field]: idStr }];
  if (!isNaN(Number(idStr))) {
    or.push({ id: BigInt(idStr) });
  }
  return or;
}

export function whereByIdNo(id: any, noField: string) {
  const idStr = String(id);
  if (isNaN(Number(idStr))) {
    return { [noField]: idStr };
  }
  return { id: BigInt(idStr) };
}
