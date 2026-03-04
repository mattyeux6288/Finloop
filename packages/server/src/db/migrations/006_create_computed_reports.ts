import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('computed_reports', (table) => {
    table.string('id', 36).primary();
    table.string('fiscal_year_id', 36).notNullable().references('id').inTable('fiscal_years').onDelete('CASCADE');
    table.string('report_type', 50).notNullable();
    table.text('data').notNullable(); // JSON en texte pour SQLite
    table.timestamp('computed_at').defaultTo(knex.fn.now());
    table.unique(['fiscal_year_id', 'report_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('computed_reports');
}
