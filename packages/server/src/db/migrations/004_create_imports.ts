import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('imports', (table) => {
    table.string('id', 36).primary();
    table.string('fiscal_year_id', 36).notNullable().references('id').inTable('fiscal_years').onDelete('CASCADE');
    table.string('filename', 255).notNullable();
    table.string('file_type', 10).notNullable();
    table.string('status', 20).defaultTo('pending');
    table.integer('row_count').nullable();
    table.text('error_log').nullable(); // JSON en texte pour SQLite
    table.timestamp('imported_at').defaultTo(knex.fn.now());
    table.index('fiscal_year_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('imports');
}
