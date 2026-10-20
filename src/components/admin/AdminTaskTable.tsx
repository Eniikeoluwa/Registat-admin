import Link from "next/link";
import { pendingTasks } from "@/data/admin/dashboard";
import AdminAsset from "./AdminAsset";

export default function AdminTaskTable({ tasks = pendingTasks }: { tasks?: typeof pendingTasks }) {
  return <div className="admin-table-scroll"><table className="admin-task-table"><thead><tr>{["Application", "Customer", "Service", "Task", "Due date", "Priority"].map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead><tbody>{tasks.map((task) => <tr key={task.reference}>
    <td><Link href={`/admin/applications/${task.reference}`}><AdminAsset name="news" />{task.reference}</Link></td><td>{task.customer}</td><td>{task.service}</td><td>{task.task}</td><td className={task.due === "Today" ? "admin-due-today" : ""}>{task.due}</td><td><span className={`admin-priority ${task.priority.toLowerCase()}`}>{task.priority}</span></td>
  </tr>)}</tbody></table>{tasks.length === 0 && <p className="admin-empty">No applications match this filter.</p>}</div>;
}
