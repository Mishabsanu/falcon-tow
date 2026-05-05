import Counter from "@/models/Counter";

export async function generateNumber(prefix: string) {
  const counter = await Counter.findOneAndUpdate(
    { name: prefix },
    { $inc: { value: 1 } },
    { upsert: true, new: true },
  );

  const year = new Date().getFullYear();

  return `${prefix}-${year}-${String(counter.value).padStart(3, "0")}`;
}
