// components/ui/table.tsx
import * as React from "react"

const Table = React.forwardRef<
    HTMLTableElement,
    React.HTMLAttributes<HTMLTableElement>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ className, ...props }, ref) => (
    <div className="overflow-x-auto">
        <table
            ref={ref}
            className="min-w-full divide-y divide-gray-200"
            {...props}
        />
    </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ className, ...props }, ref) => (
    <thead ref={ref} className="bg-gray-50" {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className="bg-white divide-y divide-gray-200"
        {...props}
    />
))
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className=""
        {...props}
    />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className="bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
        {...props}
    />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
        {...props}
    />
))
TableCell.displayName = "TableCell"

export {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
}