import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('krokmou_documents', (table) => {
    table.string('id', 36).primary();
    table.string('fiscal_year_id', 36).notNullable()
      .references('id').inTable('fiscal_years').onDelete('CASCADE');
    table.string('user_id', 36).notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('filename', 255).notNullable();
    table.text('extracted_text').notNullable();
    table.integer('page_count').nullable();
    table.timestamp('uploaded_at').defaultTo(knex.fn.now());
    table.index('fiscal_year_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('krokmou_documents');
}
