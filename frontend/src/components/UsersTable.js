
export function UsersTable({ data, columns, type, pagination, rowLimit }) {

        <div className="h-175 overflow-y-auto scrollbar">
        <Table className="table-fixed">
          {/* Header Row - No Borders & Forced White Text */}
          <TableHeader>
            <TableRow className="bg-[#00B3F3] text-white text-opacity-100 !important border-none">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={`text-s sm:text-xs text-center p-3 font-semibold uppercase tracking-wider border-none text-white text-opacity-100 
                    ${column.width} 
                    ${column.id === 'sr' ? "hidden md:block" : " "} 
                    ${column.id === 'lastUpdated' ? "hidden md:block" : " "}`}
                >
                  {column.id === "vulnerabilities" ? "CVE's" : column.colname}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="text-center text-lg">
            {data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.id} className={`${column.id === 'sr' ? "hidden md:block" : " "} ${column.id === 'lastUpdated' ? "hidden md:block" : " "} word-break: break-all; ${column.width}`}>
                    {column.id === type ? (
                      <Link
                        href={`/${type}/${encodeURIComponent(row[column.id])}`}
                        className="underline"
                      >
                        {truncateText(row[column.id], 25)}{" "}
                      </Link>
                    ) : (
                      row[column.id]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
