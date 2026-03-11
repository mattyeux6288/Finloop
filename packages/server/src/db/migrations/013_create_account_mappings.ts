import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('account_mappings', (table) => {
    table.string('id', 36).primary();
    table.string('company_id', 36).notNullable().references('id').inTable('companies').onDelete('CASCADE');
    table.text('mappings').notNullable(); // JSON stringifié des AccountOverride[]
    table.boolean('generated_by_ai').notNullable().defaultTo(false);
    table.string('naf_code', 10).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['company_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('account_mappings');
}
