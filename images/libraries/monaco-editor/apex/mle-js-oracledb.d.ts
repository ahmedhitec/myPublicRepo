/*!
 mle-js-oracledb.d.ts - The typescript definition of the Javascript MLE Environment in Oracle APEX
 Copyright (c) 2013, 2020, Oracle and/or its affiliates. All rights reserved.
 */

// global interfaces and types
declare interface IError {
    /**
     * The Oracle error number. This value is undefined for non-Oracle errors.
     */
    errorNum?: number;
    /**
     * The text of the error message.
     */
    message: string;
    /**
     * The character offset into the SQL text that resulted in the Oracle
     * error. The value may be 0 in non-SQL contexts. This value is undefined
     * for non-Oracle errors.
     */
    offset?: number;
}
declare interface IFetchInfoColumnSpec {
    type: number;
}
declare interface IFetchInfo {
    [columnName: string]: IFetchInfoColumnSpec;
}
declare interface IExecuteOptions {
    /**
     * Overrides oracledb.extendedMetaData.
     */
    extendedMetaData?: boolean;
    fetchArraySize?: number;
    /**
     * An object determining the type information of a resulting column value.
     */
    fetchInfo?: IFetchInfo;
    maxRows?: number;
    /**
     * Specify whether a row in an {@link IResultSet} should be returned as
     * Object ({@link OutFormat.OBJECT}) or Array ({@link OutFormat.ARRAY}).
     */
    outFormat?: number;
    resultSet?: boolean;
}
declare interface IBindDef {
    dir: number;
    maxSize?: number;
    type: number;
}
declare interface IObjectBindDefs {
    [bindName: string]: IBindDef;
}
declare type ArrayBindDefs = IBindDef[];
declare type BindDefs = IObjectBindDefs | ArrayBindDefs;
declare interface IExecuteManyOptions {
    batchErrors?: boolean;
    bindDefs?: BindDefs;
    dmlRowCounts?: boolean;
}
declare interface IMetaData {
    /**
     * The column name follows Oracle’s standard name-casing rules. It will commonly be uppercase,
     * since most applications create tables using unquoted, case-insensitive names.
     */
    name: string;
    /**
     * One of the mle-js-oracledb Type Constant values.
     */
    fetchType?: number;
    /**
     * One of the mle-js-oracledb Type Constant values.
     */
    dbType?: number;
    /**
     * Database byte size. This is only set for DB_TYPE_VARCHAR, DB_TYPE_CHAR and DB_TYPE_RAW column types.
     */
    byteSize?: number;
    /**
     * Set only for DB_TYPE_NUMBER, DB_TYPE_TIMESTAMP, DB_TYPE_TIMESTAMP_TZ and DB_TYPE_TIMESTAMP_LTZ columns.
     */
    precision?: number;
    /**
     * Set only for DB_TYPE_NUMBER columns.
     */
    scale?: number;
    /**
     * Indicates whether NULL values are permitted for this column.
     */
    nullable?: boolean;
}
declare interface IResultSet {
    /**
     * Contains an array of objects with metadata about the query.
     *
     * Each column’s name is always given. If the oracledb.extendedMetaData or execute() option
     * extendedMetaData are true then additional information is included.
     */
    readonly metaData: IMetaData[];
    /**
     * Closes an IResultSet.
     *
     * Applications should always call this at the end of fetch or when no more rows are needed.
     *
     * It should also be called if no rows are ever going to be fetched from the ResultSet.
     */
    close(): any;
    /**
     * This call fetches one row of the IResultSet as an object or an array of
     * column values, depending on the value of outFormat.
     *
     * At the end of fetching, the IResultSet should be freed by calling close().
     *
     * Performance of getRow() can be tuned by adjusting the value of
     * fetchArraySize.
     */
    getRow(): any;
    /**
     * This call fetches numRows rows of the IResultSet as an object or an
     * array of column values, depending on the value of outFormat.
     *
     * At the end of fetching, the ResultSet should be freed by calling close().
     *
     * Performance of getRows() can be tuned by adjusting the value of
     * fetchArraySize.
     */
    getRows(numRows: number): any[];
    /**
     * Convenience function for getting an iterator of this IResultSet.
     *
     * This is equivalent to calling rs[Symbol.iterator]().
     *
     * @returns an iterator over the rows of this IResultSet.
     *
     * @throws {@link OracleError} if the IResultSet has already been closed
     * @throws {@link OracleError} if the IResultSet is already being iterated over
     */
    iterator(): IterableIterator<any>;
    /**
     * This function defines the default iterator for an IResultSet
     * object which can be used to iterate over its rows. Using the
     * default iterator, an IResultSet can be iterated over using
     * the for..of construct.
     *
     * @throws {@link OracleError} if the IResultSet has already been closed
     * @throws {@link OracleError} if the IResultSet is already being iterated over
     *
     */
    [Symbol.iterator](): IterableIterator<any>;
}
declare interface IExecuteReturn {
    metaData?: IMetaData[];
    outBinds?: Record<string, any>;
    resultSet?: IResultSet;
    rows?: any[];
    rowsAffected?: number;
}
declare interface IExecuteManyReturn {
    batchErrors?: IError[];
    dmlRowCounts?: number[];
    outBinds?: Record<string, any>[];
    rowsAffected?: number;
}
declare interface IBindObjectValue {
    /**
     * The direction of the bind. One of the constants oracledb.BIND_IN,
     * oracledb.BIND_INOUT, or oracledb.BIND_OUT. The default is
     * oracledb.BIND_IN.
     */
    dir?: number;
    /**
     * The number of array elements to be allocated for a PL/SQL Collection
     * INDEX BY associative array OUT or INOUT array bind variable. For IN
     * binds, the value of maxArraySize is ignored.
     */
    maxArraySize?: number;
    /**
     * The maximum number of bytes that an OUT or INOUT bind variable of type
     * oracledb.STRING or oracledb.BUFFER can use to get data. The default
     * value is 200. The maximum limit depends on the database type. When
     * binding INOUT, then maxSize refers to the size of the returned value.
     * The input value can be smaller or bigger. For IN binds, maxSize is
     * ignored.
     */
    maxSize?: number;
    /**
     * The mle-js-oracledb or JavaScript data type to be bound. One of the
     * constants oracledb.BLOB, oracledb.BUFFER, oracledb.CLOB,
     * oracledb.CURSOR, oracledb.DATE, oracledb.NUMBER, or oracledb.STRING.
     * With IN or INOUT binds the type can be explicitly set with type or it
     * will default to the type of the input data value. With OUT binds, the
     * type defaults to oracledb.STRING whenever type is not specified.
     */
    type?: number;
    /**
     * The input value or variable to be used for an IN or INOUT bind variable.
     */
    val: any;
}
declare type BindValue = IBindObjectValue | any;
declare interface INamedBinds {
    [bindName: string]: BindValue;
}
declare type PosBinds = BindValue[];
declare type BindParameters = INamedBinds | PosBinds;
declare interface IStatementInfo {
    bindNames: string[];
    metaData?: IMetaData[];
    statementType: number;
}
declare interface IConnection {
    readonly oracleServerVersion: number;
    readonly oracleServerVersionString: string;
    readonly stmtCacheSize: number;
    commit(): void;
    execute(sqlText: string): IExecuteReturn;
    execute(sql: string, bindParams: BindParameters, options?: IExecuteOptions): IExecuteReturn;
    executeMany(sql: string, binds: BindParameters[], options?: IExecuteManyOptions): IExecuteManyReturn;
    executeMany(sql: string, numIterations: number, options?: IExecuteManyOptions): IExecuteManyReturn;
    getSodaDatabase(): any;
    getStatementInfo(sql: string): IStatementInfo;
    rollback(): void;
}
declare type JsType = number;
declare type DbType = number;
declare class Parameters {
    /**
     * The maximum number of rows that are fetched by a query with
     * connection.execute() when not using an IResultSet. Rows beyond this limit are
     * not fetched from the database. A value of 0 means there is no limit.
     *
     * The default value is 0, meaning unlimited.
     *
     * This property may be overridden in an execute() call.
     *
     * To improve database efficiency, SQL queries should use a row limiting clause
     * like OFFSET / FETCH or equivalent. The maxRows property can be used to stop
     * badly coded queries from returning unexpectedly large numbers of rows.
     *
     * When the number of query rows is relatively big, or can not be predicted, it
     * is recommended to use an IResultSet. This allows applications to process rows
     * in smaller chunks or individually, preventing the PGA limits being exceeded
     * or query results being unexpectedly truncated by a maxRows limit.
     */
    private _maxRows;
    get maxRows(): number;
    set maxRows(value: number);
    /**
     * The format of query rows fetched when using connection.execute(). It affects
     * both IResultSet and non-IResultSet queries. This can be either of the
     * constants ARRAY or OBJECT. The default value is ARRAY.
     *
     * If specified as ARRAY, each row is fetched as an array of column values.
     *
     * If specified as OBJECT, each row is fetched as a JavaScript object. The
     * object has a property for each column name, with the property value set to
     * the respective column value. The property name follows Oracle's standard
     * name-casing rules. It will commonly be uppercase, since most applications
     * create tables using unquoted, case-insensitive names.
     *
     * This property may be overridden in an execute() call.
     */
    private _outFormat;
    get outFormat(): number;
    set outFormat(value: number);
    /**
     * This property sets the size of an internal buffer used for fetching query
     * rows from Oracle Database. Changing it may affect query performance but
     * does not affect how many rows are returned to the application.
     *
     * The default value is 100.
     *
     * The property is used during the default direct fetches and during
     * IResultSet getRow() and getRows() calls.
     *
     * Increasing this value reduces the number of round-trips to the database
     * but increases memory usage for each data fetch. For queries that return a
     * large number of rows, higher values of fetchArraySize may give better
     * performance. For queries that only return a few rows, reduce the value of
     * fetchArraySize to minimize the amount of memory management during data
     * fetches.
     *
     * For direct fetches (those using execute() option resultSet: false), the
     * internal buffer size will be based on the lesser of maxRows and
     * fetchArraySize.
     */
    private _fetchArraySize;
    get fetchArraySize(): number;
    set fetchArraySize(value: number);
    /**
     * Determines whether additional metadata is available for queries.
     *
     * The default value is false. With this value, the result.metaData
     * and result.resultSet.metaData objects only include column names.
     *
     * This property may be overridden in an execute() call.
     */
    private _extendedMetaData;
    get extendedMetaData(): boolean;
    set extendedMetaData(value: boolean);
    /**
     * An array of mle-js-oracledb types. The valid types are oracledb.DATE,
     * oracledb.NUMBER, oracledb.UINT8ARRAY, and oracledb.ORACLE_CLOB. When any
     * column having one of the specified types is queried with execute(), the
     * column data is returned as a string instead of the default representation.
     *
     * By default in mle-js-oracledb, all columns are returned as native types or
     * or as OracleClob/OracleBlob wrapper types, in the case of CLOB and BLOB
     * types.
     *
     * This property helps avoid situations where using JavaScript types can lead
     * to numeric precision loss, or where date conversion is unwanted. See Query
     * Result Type Mapping for more discussion.
     *
     * For raw data returned as a string, Oracle returns the data as a
     * hex-encoded string. For dates and numbers returned as a string, the
     * maximum length of a string created by this mapping is 200 bytes. Strings
     * created for CLOB columns will generally be limited by Node.js and V8
     * memory restrictions.
     *
     * Individual query columns in execute() calls can override the fetchAsString
     * global setting by using fetchInfo.
     */
    private _fetchAsString;
    get fetchAsString(): JsType[];
    set fetchAsString(value: JsType[]);
    /**
     * An array of node-oracledb types. Currently the only valid type is
     * oracledb.ORACLE_BLOB. When a BLOB column is queried with execute(), the
     * column data is returned as a UINT8ARRAY instead of the default
     * representation.
     *
     * By default in mle-js-oracledb, all columns are returned as native types or
     * or as OracleClob/OracleBlob wrapper types, in the case of CLOB and BLOB
     * types.
     *
     * Individual query columns in execute() calls can override the fetchAsString
     * global setting by using fetchInfo.
     */
    private _fetchAsUint8Array;
    get fetchAsUint8Array(): JsType[];
    set fetchAsUint8Array(value: JsType[]);
    /**
     * An array of mle-js-oracledb types. The valid types are oracledb.DATE,
     * oracledb.NUMBER and oracledb.STRING. When any column having one of the
     * specified types is queried with execute(), the column data is returned as
     * a string instead of the default representation.
     *
     * By default in mle-js-oracledb, all columns are returned as native types or
     * or as OracleClob/OracleBlob wrapper types, in the case of CLOB and BLOB
     * types.
     *
     * For type that be set in both properties (fetchAsString and
     * fetchAsPlsqlWrapper), i.e. DATE and NUMBER, the fetchAsString property has
     * precedence over the fetchAsPlsqlWrapper property.
     *
     * Individual query columns in execute() calls can override the fetchAsString
     * global setting by using fetchInfo.
     */
    private _fetchAsPlsqlWrapper;
    get fetchAsPlsqlWrapper(): JsType[];
    set fetchAsPlsqlWrapper(value: JsType[]);
}

// global namespace - apex
declare namespace apex.db {

    function jsTypeNameByValue(typeConst: number): string;
    /**
     * Fetch each row as array of column values
     */
    const ARRAY: JsType;
    /**
     * Fetch each row as an object
     */
    const OBJECT: JsType;
    /**
     * Used with fetchInfo to reset the fetch type to the database type
     */
    const DEFAULT: JsType;
    /**
     * Bind as JavaScript String type. Can be used for most database types.
     */
    const STRING: JsType;
    /**
     * Bind as JavaScript number type. Can also be used for fetchAsString and
     * fetchInfo.
     */
    const NUMBER: JsType;
    /**
     * Bind as JavaScript date type. Can also be used for fetchAsString and
     * fetchInfo.
     */
    const DATE: JsType;
    /**
     * Bind a REF CURSOR to a mle-js-oracledb IResultSet
     */
    const CURSOR: JsType;
    /**
     * Bind a RAW, LONG RAW or BLOB to a Buffer class
     */
    const BUFFER: JsType;
    /**
     * Bind a NUMBER to a OracleNumber object.
     */
    const ORACLE_NUMBER: JsType;
    /**
     * Bind a DATE to a OracleDate object.
     */
    const ORACLE_DATE: JsType;
    /**
     * Bind a BLOB to a OracleBLOB object.
     */
    const ORACLE_BLOB: JsType;
    /**
     * Bind a CLOB to a OracleCLOB object.
     */
    const ORACLE_CLOB: JsType;
    /**
     * Bind a INTERVAL DAY TO SECOND to a OracleIntervalDayToSecond object.
     */
    const ORACLE_INTERVAL_DS: number;
    /**
     * Bind a INTERVAL YEAR TO MONTH to a OracleIntervalYearToMonth object.
     */
    const ORACLE_INTERVAL_YM: number;
    /**
     * Bind as JavaScript boolean type. Can also be used for fetchAsString and
     * fetchInfo.
     */
    const BOOLEAN: JsType;
    /**
     * Bind a RAW, LONG RAW or BLOB to a Uint8Array typed array
     */
    const UINT8ARRAY: number;
    /**
     * Bind a TIMESTAMP to a OracleTimestamp object.
     */
    const ORACLE_TIMESTAMP: number;
    /**
     * Bind a TIMESTAMP WITH TIME ZONE or TIMESTAMP WITH LOCAL TIME ZONE to a OracleTimestampTZ object.
     */
    const ORACLE_TIMESTAMP_TZ: number;
    /**
     * Bind a (N)VARCHAR2 or (N)CHAR to a OracleCharacter object.
     */
    /**
     * Bind a UROWID to a OracleRowId object.
     */
    function dbTypeNameByValue(typeConst: DbType): string;
    /**
     * VARCHAR2
     */
    const DB_TYPE_VARCHAR: DbType;
    /**
     * NUMBER or FLOAT
     */
    const DB_TYPE_NUMBER: DbType;
    /**
     * LONG
     */
    const DB_TYPE_LONG: DbType;
    /**
     * DATE
     */
    const DB_TYPE_DATE: DbType;
    /**
     * RAW
     */
    const DB_TYPE_RAW: DbType;
    /**
     * LONG RAW
     */
    const DB_TYPE_LONG_RAW: DbType;
    /**
     * CHAR
     */
    const DB_TYPE_CHAR: DbType;
    /**
     * BINARY_FLOAT
     */
    const DB_TYPE_BINARY_FLOAT: DbType;
    /**
     * BINARY_DOUBLE
     */
    const DB_TYPE_BINARY_DOUBLE: DbType;
    /**
     * BINARY_INTEGER
     */
    const DB_TYPE_BINARY_INTEGER: DbType;
    /**
     * ROWID
     */
    const DB_TYPE_ROWID: DbType;
    /**
     * CLOB
     */
    const DB_TYPE_CLOB: DbType;
    /**
     * BLOB
     */
    const DB_TYPE_BLOB: DbType;
    /**
     * TIMESTAMP
     */
    const DB_TYPE_TIMESTAMP: DbType;
    /**
     * TIMESTAMP WITH TIME ZONE
     */
    const DB_TYPE_TIMESTAMP_TZ: DbType;
    /**
     * INTERVAL YEAR TO MONTH
     */
    const DB_TYPE_INTERVAL_YM: DbType;
    /**
     * INTERVAL DAY TO SECOND
     */
    const DB_TYPE_INTERVAL_DS: DbType;
    /**
     * UROWID
     */
    const DB_TYPE_UROWID: DbType;
    /**
     * BOOLEAN
     */
    const DB_TYPE_BOOLEAN: DbType;
    /**
     * TIMESTAMP WITH LOCAL TIME ZONE
     */
    const DB_TYPE_TIMESTAMP_LTZ: DbType;
    /**
     * NVARCHAR
     */
    const DB_TYPE_NVARCHAR: DbType;
    /**
     * NCHAR
     */
    const DB_TYPE_NCHAR: DbType;
    /**
     * NCLOB
     */
    const DB_TYPE_NCLOB: DbType;
    /**
     * Direction for IN binds
     */
    const BIND_IN = 3001;
    /**
     * Direction for INOUT binds
     */
    const BIND_INOUT = 3002;
    /**
     * Direction for OUT binds
     */
    const BIND_OUT = 3003;
    /**
     * Unknown statement type
     */
    const STMT_TYPE_UNKNOWN = 0;
    /**
     * SELECT
     */
    const STMT_TYPE_SELECT = 1;
    /**
     * UPDATE
     */
    const STMT_TYPE_UPDATE = 2;
    /**
     * DELETE
     */
    const STMT_TYPE_DELETE = 3;
    /**
     * INSERT
     */
    const STMT_TYPE_INSERT = 4;
    /**
     * CREATE
     */
    const STMT_TYPE_CREATE = 5;
    /**
     * DROP
     */
    const STMT_TYPE_DROP = 6;
    /**
     * ALTER
     */
    const STMT_TYPE_ALTER = 7;
    /**
     * BEGIN
     */
    const STMT_TYPE_BEGIN = 8;
    /**
     * DECLARE
     */
    const STMT_TYPE_DECLARE = 9;
    /**
     * CALL
     */
    const STMT_TYPE_CALL = 10;
    /**
     * EXPLAIN PLAN
     */
    const STMT_TYPE_EXPLAIN_PLAN = 15;
    /**
     * MERGE
     */
    const STMT_TYPE_MERGE = 16;
    /**
     * ROLLBACK
     */
    const STMT_TYPE_ROLLBACK = 17;
    /**
     * COMMIT
     */
    const STMT_TYPE_COMMIT = 21;

    const parameters: Parameters;
}

declare namespace apex {
    const conn: IConnection;
    const env: Object;
}