import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('fiscal_years', (table) => {
    table.string('id', 36).primary();
    table.string('company_id', 36).notNullable().references('id').inTable('companies').onDelete('CASCADE');
    table.string('label', 50).notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.boolean('is_closed').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['company_id', 'start_date', 'end_date']);
    table.index('company_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('fiscal_years');
}
