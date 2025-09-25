"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin-layout";

// Database Inspector Component
interface DatabaseTable {
  name: string;
  rowCount: number;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
}

interface DatabaseRecord {
  id: string;
  data: Record<string, string | number | boolean | null>;
  table: string;
}

const DatabaseInspector = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [records, setRecords] = useState<DatabaseRecord[]>([]);
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM clients LIMIT 10;");
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: string[][]; rowCount: number } | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string>("");

  const fetchDatabaseInfo = async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Mock database data for demonstration
      const mockTables: DatabaseTable[] = [
        {
          name: "clients",
          rowCount: 6,
          columns: [
            { name: "id", type: "UUID", nullable: false },
            { name: "name", type: "TEXT", nullable: false },
            { name: "email", type: "TEXT", nullable: false },
            { name: "phone", type: "TEXT", nullable: true },
            { name: "company", type: "TEXT", nullable: true },
            { name: "status", type: "TEXT", nullable: true },
            { name: "role", type: "TEXT", nullable: true },
            { name: "created_at", type: "TIMESTAMP", nullable: false },
            { name: "updated_at", type: "TIMESTAMP", nullable: true }
          ]
        },
        {
          name: "projects",
          rowCount: 1,
          columns: [
            { name: "id", type: "UUID", nullable: false },
            { name: "name", type: "TEXT", nullable: false },
            { name: "client_id", type: "UUID", nullable: true },
            { name: "status", type: "TEXT", nullable: true },
            { name: "created_at", type: "TIMESTAMP", nullable: false },
            { name: "updated_at", type: "TIMESTAMP", nullable: true }
          ]
        },
        {
          name: "invoices",
          rowCount: 0,
          columns: [
            { name: "id", type: "UUID", nullable: false },
            { name: "invoice_number", type: "TEXT", nullable: false },
            { name: "client_id", type: "UUID", nullable: false },
            { name: "project_id", type: "UUID", nullable: true },
            { name: "amount", type: "DECIMAL", nullable: false },
            { name: "status", type: "TEXT", nullable: false },
            { name: "due_date", type: "TIMESTAMP", nullable: false },
            { name: "description", type: "TEXT", nullable: true },
            { name: "created_at", type: "TIMESTAMP", nullable: false },
            { name: "updated_at", type: "TIMESTAMP", nullable: true }
          ]
        },
        {
          name: "support_tickets",
          rowCount: 0,
          columns: [
            { name: "id", type: "UUID", nullable: false },
            { name: "subject", type: "TEXT", nullable: false },
            { name: "description", type: "TEXT", nullable: false },
            { name: "priority", type: "TEXT", nullable: false },
            { name: "status", type: "TEXT", nullable: false },
            { name: "client_id", type: "UUID", nullable: true },
            { name: "project_id", type: "UUID", nullable: true },
            { name: "created_at", type: "TIMESTAMP", nullable: false },
            { name: "updated_at", type: "TIMESTAMP", nullable: true }
          ]
        },
        {
          name: "activity_log",
          rowCount: 0,
          columns: [
            { name: "id", type: "UUID", nullable: false },
            { name: "user_id", type: "UUID", nullable: true },
            { name: "action", type: "TEXT", nullable: false },
            { name: "entity_type", type: "TEXT", nullable: false },
            { name: "details", type: "JSONB", nullable: true },
            { name: "created_at", type: "TIMESTAMP", nullable: false }
          ]
        }
      ];

      // Mock records for demonstration
      const mockRecords: DatabaseRecord[] = [
        {
          id: "1",
          table: "clients",
          data: {
            id: "4eba03d9-45d7-4c3b-9185-97d8b644605e",
            name: "Admin User",
            email: "admin@websiter.click",
            phone: null,
            company: null,
            status: "active",
            role: "admin",
            created_at: "2025-09-19T15:30:00Z",
            updated_at: "2025-09-19T15:30:00Z"
          }
        },
        {
          id: "2", 
          table: "clients",
          data: {
            id: "some-uuid-here",
            name: "Orphilosophy User",
            email: "orphilosophy2024@gmail.com",
            phone: null,
            company: null,
            status: "active",
            role: "client",
            created_at: "2025-09-19T19:20:00Z",
            updated_at: "2025-09-19T19:20:00Z"
          }
        }
      ];

      setTables(mockTables);
      setRecords(mockRecords);
      
      // If we have a selected table, keep it selected
      if (selectedTable && mockTables.find(t => t.name === selectedTable)) {
        // Table still exists, keep it selected
      } else if (mockTables.length > 0) {
        setSelectedTable(mockTables[0].name);
      }

    } catch (err) {
      setError("Failed to fetch database information");
      console.error("Database inspector error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuery = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Mock query execution for demonstration
      const mockQueryResult = {
        columns: ["id", "name", "email", "status"],
        rows: [
          ["4eba03d9-45d7-4c3b-9185-97d8b644605e", "Admin User", "admin@websiter.click", "active"],
          ["some-uuid-here", "Orphilosophy User", "orphilosophy2024@gmail.com", "active"]
        ],
        rowCount: 2
      };

      setQueryResult(mockQueryResult);
    } catch (err) {
      setError("Failed to execute query");
      console.error("Query execution error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessage(`Copied ${type} to clipboard!`);
      setTimeout(() => setCopiedMessage(""), 3000);
    } catch (err) {
      setError("Failed to copy to clipboard");
      console.error("Copy error:", err);
    }
  };

  const formatTableData = (tableData: DatabaseTable[]) => {
    return tableData.map(table => 
      `${table.name} (${table.rowCount} rows, ${table.columns.length} columns)`
    ).join('\n');
  };

  const formatRecordsData = (records: DatabaseRecord[]) => {
    return records.map(record => 
      `Table: ${record.table}\n${Object.entries(record.data)
        .map(([key, value]) => `  ${key}: ${value === null ? 'NULL' : value}`)
        .join('\n')}`
    ).join('\n\n');
  };

  const formatQueryResult = (result: { columns: string[]; rows: string[][]; rowCount: number }) => {
    const header = result.columns.join('\t');
    const rows = result.rows.map(row => row.join('\t')).join('\n');
    return `${header}\n${rows}`;
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const getTableStatus = (rowCount: number) => {
    if (rowCount === 0) return "bg-gray-100 text-gray-800";
    if (rowCount < 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Database Inspector</h2>
        <Button onClick={fetchDatabaseInfo} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh Database Info"}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
          {error}
        </div>
      )}

      {copiedMessage && (
        <div className="p-3 bg-green-100 border border-green-200 rounded-md text-green-800">
          {copiedMessage}
        </div>
      )}

      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card 
            key={table.name} 
            className={`p-4 cursor-pointer transition-colors ${selectedTable === table.name ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
            onClick={() => setSelectedTable(table.name)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{table.name}</h3>
              <Badge className={getTableStatus(table.rowCount)}>
                {table.rowCount} rows
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {table.columns.length} columns
            </p>
          </Card>
        ))}
      </div>

      {/* Selected Table Details */}
      {selectedTable && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Table: {selectedTable}</h3>
            <Badge className={getTableStatus(tables.find(t => t.name === selectedTable)?.rowCount || 0)}>
              {tables.find(t => t.name === selectedTable)?.rowCount || 0} records
            </Badge>
          </div>

          {/* Table Schema */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Schema</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(formatTableData(tables), "table schema")}
              >
                Copy Schema
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left">Column Name</th>
                    <th className="border border-border px-4 py-2 text-left">Type</th>
                    <th className="border border-border px-4 py-2 text-left">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.find(t => t.name === selectedTable)?.columns.map((column) => (
                    <tr key={column.name}>
                      <td className="border border-border px-4 py-2 font-mono text-sm">{column.name}</td>
                      <td className="border border-border px-4 py-2">{column.type}</td>
                      <td className="border border-border px-4 py-2">
                        <Badge className={column.nullable ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                          {column.nullable ? "NULL" : "NOT NULL"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sample Records */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Sample Records</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(formatRecordsData(records.filter(r => r.table === selectedTable)), "sample records")}
              >
                Copy Records
              </Button>
            </div>
            {records.filter(r => r.table === selectedTable).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      {Object.keys(records.find(r => r.table === selectedTable)?.data || {}).map((key) => (
                        <th key={key} className="border border-border px-4 py-2 text-left font-mono text-sm">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.filter(r => r.table === selectedTable).map((record) => (
                      <tr key={record.id}>
                        {Object.values(record.data).map((value, index) => (
                          <td key={index} className="border border-border px-4 py-2 text-sm">
                            {value === null ? <span className="text-muted-foreground">NULL</span> : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No records found in this table.</p>
            )}
          </div>
        </Card>
      )}

      {/* SQL Query Executor */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">SQL Query Executor</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="sqlQuery">SQL Query</Label>
            <Textarea
              id="sqlQuery"
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="mt-1 font-mono text-sm"
              rows={4}
              placeholder="Enter your SQL query here..."
            />
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={executeQuery} disabled={isLoading}>
              {isLoading ? "Executing..." : "Execute Query"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSqlQuery("SELECT * FROM clients LIMIT 10;")}
            >
              Reset Query
            </Button>
          </div>
        </div>

        {queryResult && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Query Results ({queryResult.rowCount} rows)</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(formatQueryResult(queryResult), "query results")}
              >
                Copy Results
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    {queryResult.columns.map((column: string) => (
                      <th key={column} className="border border-border px-4 py-2 text-left font-mono text-sm">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResult.rows.map((row: string[], index: number) => (
                    <tr key={index}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-border px-4 py-2 text-sm">
                          {cell === null ? <span className="text-muted-foreground">NULL</span> : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalInvoices: number;
  pendingInvoices: number;
  totalContacts: number;
  newContacts: number;
  totalSupportTickets: number;
  openTickets: number;
  systemUptime: string;
  lastBackup: string;
}

interface SystemConfig {
  siteName: string;
  adminEmail: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  emailNotifications: boolean;
  backupFrequency: string;
  maxUploadSize: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "debug";
  message: string;
  source: string;
}

interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  database: boolean;
  api: boolean;
  email: boolean;
}

export default function AdminSystemPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    totalContacts: 0,
    newContacts: 0,
    totalSupportTickets: 0,
    openTickets: 0,
    systemUptime: "",
    lastBackup: ""
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    siteName: "",
    adminEmail: "",
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true,
    backupFrequency: "daily",
    maxUploadSize: 10
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpu: 0,
    memory: 0,
    disk: 0,
    database: true,
    api: true,
    email: true
  });
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all");
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);

  // Mock data for development
  const mockSystemStats: SystemStats = {
    totalUsers: 124,
    activeUsers: 87,
    totalProjects: 56,
    activeProjects: 32,
    totalInvoices: 78,
    pendingInvoices: 12,
    totalContacts: 45,
    newContacts: 8,
    totalSupportTickets: 23,
    openTickets: 7,
    systemUptime: "15 days, 4 hours, 32 minutes",
    lastBackup: "2023-06-28T02:30:00Z"
  };

  const mockSystemConfig: SystemConfig = {
    siteName: "websiter.click",
    adminEmail: "admin@websiter.click",
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true,
    backupFrequency: "daily",
    maxUploadSize: 10
  };

  const mockLogs: LogEntry[] = [
    { id: "1", timestamp: "2023-06-28T10:30:15Z", level: "info", message: "User login successful", source: "auth" },
    { id: "2", timestamp: "2023-06-28T10:25:42Z", level: "warning", message: "High memory usage detected", source: "system" },
    { id: "3", timestamp: "2023-06-28T10:20:18Z", level: "error", message: "Failed to send email notification", source: "email" },
    { id: "4", timestamp: "2023-06-28T10:15:33Z", level: "info", message: "New project created", source: "projects" },
    { id: "5", timestamp: "2023-06-28T10:10:27Z", level: "debug", message: "Database query executed", source: "database" },
    { id: "6", timestamp: "2023-06-28T10:05:11Z", level: "info", message: "System backup completed successfully", source: "backup" },
    { id: "7", timestamp: "2023-06-28T10:00:45Z", level: "warning", message: "Disk space running low", source: "system" }
  ];

  const mockSystemHealth: SystemHealth = {
    cpu: 45,
    memory: 62,
    disk: 78,
    database: true,
    api: true,
    email: false
  };

  const fetchSystemData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setError("You must be logged in to view the admin portal");
        router.push("/login");
        return;
      }

      // In a real implementation, we would fetch from the API
      // For now, we'll use mock data
      setTimeout(() => {
        setSystemStats(mockSystemStats);
        setSystemConfig(mockSystemConfig);
        setLogs(mockLogs);
        setSystemHealth(mockSystemHealth);
        setFilteredLogs(mockLogs);
        setIsLoading(false);
      }, 1000);
      
      // Actual implementation would be:
      /*
      const statsResponse = await fetch("/api/admin/system/stats", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setSystemStats(data.stats || {});
      } else {
        const errorData = await statsResponse.json();
        setError(errorData.message || "Failed to fetch system stats");
      }

      const configResponse = await fetch("/api/admin/system/config", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (configResponse.ok) {
        const data = await configResponse.json();
        setSystemConfig(data.config || {});
      } else {
        const errorData = await configResponse.json();
        setError(errorData.message || "Failed to fetch system config");
      }

      const logsResponse = await fetch("/api/admin/system/logs", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (logsResponse.ok) {
        const data = await logsResponse.json();
        setLogs(data.logs || []);
        setFilteredLogs(data.logs || []);
      } else {
        const errorData = await logsResponse.json();
        setError(errorData.message || "Failed to fetch system logs");
      }

      const healthResponse = await fetch("/api/admin/system/health", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (healthResponse.ok) {
        const data = await healthResponse.json();
        setSystemHealth(data.health || {});
      } else {
        const errorData = await healthResponse.json();
        setError(errorData.message || "Failed to fetch system health");
      }
      */
    } catch (err) {
      setError("An error occurred while loading system data");
      console.error("Admin system error:", err);
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  useEffect(() => {
    // Apply log level filter
    if (logLevelFilter === "all") {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(log => log.level === logLevelFilter));
    }
  }, [logs, logLevelFilter]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    setError("");

    try {
      // In a real implementation, we would save to the API
      // For now, we'll just show a success message
      setTimeout(() => {
        setIsSavingConfig(false);
      }, 1000);
      
      // Actual implementation would be:
      /*
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to update system config");
        return;
      }

      const response = await fetch("/api/admin/system/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify(systemConfig),
      });

      if (response.ok) {
        // Config saved successfully
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to save system config");
      }
      */
    } catch (err) {
      setError("An error occurred while saving the system config");
      console.error("Save config error:", err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleRunBackup = async () => {
    try {
      // In a real implementation, we would trigger a backup
      // For now, we'll just update the last backup time
      setSystemStats({
        ...systemStats,
        lastBackup: new Date().toISOString()
      });
      
      // Actual implementation would be:
      /*
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to run backup");
        return;
      }

      const response = await fetch("/api/admin/system/backup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (response.ok) {
        // Backup started successfully
        fetchSystemData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to run backup");
      }
      */
    } catch (err) {
      setError("An error occurred while running the backup");
      console.error("Run backup error:", err);
    }
  };

  const handleClearLogs = async () => {
    try {
      // In a real implementation, we would clear the logs
      // For now, we'll just empty the logs array
      setLogs([]);
      setFilteredLogs([]);
      
      // Actual implementation would be:
      /*
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to clear logs");
        return;
      }

      const response = await fetch("/api/admin/system/logs", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (response.ok) {
        // Logs cleared successfully
        setLogs([]);
        setFilteredLogs([]);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to clear logs");
      }
      */
    } catch (err) {
      setError("An error occurred while clearing the logs");
      console.error("Clear logs error:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "info":
        return "bg-blue-100 text-blue-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "debug":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthStatus = (value: number) => {
    if (value < 50) return "text-green-600";
    if (value < 80) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <AdminLayout
      title="System Administration"
      showRefresh={true}
      onRefresh={fetchSystemData}
      isLoading={isLoading}
    >
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Monitor system performance, configure settings, and manage debug tools
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="health">System Health</TabsTrigger>
              <TabsTrigger value="database">Database Inspector</TabsTrigger>
              <TabsTrigger value="logs">Debug Logs</TabsTrigger>
            </TabsList>
            
            {/* Statistics Tab */}
            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Users</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Users</span>
                      <span className="font-medium">{systemStats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Users</span>
                      <span className="font-medium">{systemStats.activeUsers}</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Projects</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Projects</span>
                      <span className="font-medium">{systemStats.totalProjects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Projects</span>
                      <span className="font-medium">{systemStats.activeProjects}</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Invoices</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Invoices</span>
                      <span className="font-medium">{systemStats.totalInvoices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Invoices</span>
                      <span className="font-medium">{systemStats.pendingInvoices}</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Contacts</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Contacts</span>
                      <span className="font-medium">{systemStats.totalContacts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Contacts</span>
                      <span className="font-medium">{systemStats.newContacts}</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Support</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Tickets</span>
                      <span className="font-medium">{systemStats.totalSupportTickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Open Tickets</span>
                      <span className="font-medium">{systemStats.openTickets}</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">System</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Uptime</span>
                      <span className="font-medium">{systemStats.systemUptime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last Backup</span>
                      <span className="font-medium">{formatDate(systemStats.lastBackup)}</span>
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button onClick={handleRunBackup} size="sm">
                        Run Backup Now
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            {/* Configuration Tab */}
            <TabsContent value="config" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">System Configuration</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={systemConfig.siteName}
                      onChange={(e) => setSystemConfig({...systemConfig, siteName: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={systemConfig.adminEmail}
                      onChange={(e) => setSystemConfig({...systemConfig, adminEmail: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select onValueChange={(value) => setSystemConfig({...systemConfig, backupFrequency: value})} value={systemConfig.backupFrequency}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
                    <Input
                      id="maxUploadSize"
                      type="number"
                      value={systemConfig.maxUploadSize}
                      onChange={(e) => setSystemConfig({...systemConfig, maxUploadSize: parseInt(e.target.value) || 0})}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={systemConfig.maintenanceMode}
                      onChange={(e) => setSystemConfig({...systemConfig, maintenanceMode: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowRegistrations"
                      checked={systemConfig.allowRegistrations}
                      onChange={(e) => setSystemConfig({...systemConfig, allowRegistrations: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="allowRegistrations">Allow Registrations</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={systemConfig.emailNotifications}
                      onChange={(e) => setSystemConfig({...systemConfig, emailNotifications: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button onClick={handleSaveConfig} disabled={isSavingConfig}>
                    {isSavingConfig ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>
              </Card>
            </TabsContent>
            
            {/* System Health Tab */}
            <TabsContent value="health" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Resource Usage</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>CPU Usage</span>
                        <span className={`font-medium ${getHealthStatus(systemHealth.cpu)}`}>{systemHealth.cpu}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${systemHealth.cpu < 50 ? 'bg-green-600' : systemHealth.cpu < 80 ? 'bg-yellow-600' : 'bg-red-600'}`}
                          style={{ width: `${systemHealth.cpu}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Memory Usage</span>
                        <span className={`font-medium ${getHealthStatus(systemHealth.memory)}`}>{systemHealth.memory}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${systemHealth.memory < 50 ? 'bg-green-600' : systemHealth.memory < 80 ? 'bg-yellow-600' : 'bg-red-600'}`}
                          style={{ width: `${systemHealth.memory}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Disk Usage</span>
                        <span className={`font-medium ${getHealthStatus(systemHealth.disk)}`}>{systemHealth.disk}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${systemHealth.disk < 50 ? 'bg-green-600' : systemHealth.disk < 80 ? 'bg-yellow-600' : 'bg-red-600'}`}
                          style={{ width: `${systemHealth.disk}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Service Status</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Database</span>
                      <Badge className={systemHealth.database ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {systemHealth.database ? "Online" : "Offline"}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>API</span>
                      <Badge className={systemHealth.api ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {systemHealth.api ? "Online" : "Offline"}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Email Service</span>
                      <Badge className={systemHealth.email ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {systemHealth.email ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            {/* Database Inspector Tab */}
            <TabsContent value="database" className="space-y-6">
              <DatabaseInspector />
            </TabsContent>
            
            {/* Debug Logs Tab */}
            <TabsContent value="logs" className="space-y-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Debug Logs</h2>
                  <div className="flex space-x-2">
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={logLevelFilter}
                      onChange={(e) => setLogLevelFilter(e.target.value)}
                    >
                      <option value="all">All Levels</option>
                      <option value="debug">Debug</option>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                    <Button variant="outline" onClick={handleClearLogs}>
                      Clear Logs
                    </Button>
                  </div>
                </div>
                
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No logs found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Timestamp</th>
                          <th className="text-left py-3 px-4">Level</th>
                          <th className="text-left py-3 px-4">Source</th>
                          <th className="text-left py-3 px-4">Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">{formatDateTime(log.timestamp)}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLogLevelColor(log.level)}`}>
                                {log.level}
                              </span>
                            </td>
                            <td className="py-3 px-4">{log.source}</td>
                            <td className="py-3 px-4">{log.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </section>
    </AdminLayout>
  );
}